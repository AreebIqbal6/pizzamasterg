"use server"

import { createClient } from '@supabase/supabase-js'
import { sanitizeInput } from '@/lib/sanitize'
import { cookies, headers } from 'next/headers'
import { isAdminEmail, isHardcodedKitchenEmail, normalizeEmail } from '@/lib/auth/access'

export async function updateOrderStatus(rawOrderId: string, rawNewStatus: string, rawRiderName?: string, rawCancellationReason?: string) {
  const orderId = sanitizeInput(rawOrderId)
  const newStatus = sanitizeInput(rawNewStatus)
  const riderName = rawRiderName ? sanitizeInput(rawRiderName) : undefined
  const cancellationReason = rawCancellationReason ? sanitizeInput(rawCancellationReason) : undefined

  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  let tokenStr = ""
  const cookieName = 'sb-vxfojrbieoocnkkntraa-auth-token'
  
  // Handle chunked cookies
  const tokenCookies = allCookies.filter(c => c.name.startsWith(cookieName)).sort((a, b) => a.name.localeCompare(b.name))
  if (tokenCookies.length > 0) {
    if (tokenCookies.length === 1 && tokenCookies[0].name === cookieName) {
      tokenStr = tokenCookies[0].value
    } else {
      tokenStr = tokenCookies.map(c => c.value).join('')
    }
  }

  if (!tokenStr) {
    throw new Error("Unauthorized (No Token)")
  }

  // Parse the access token safely
  let accessToken = ""
  try {
    const decoded = decodeURIComponent(tokenStr)
    if (decoded.startsWith('[') || decoded.startsWith('{')) {
      const parsed = JSON.parse(decoded)
      accessToken = parsed.access_token || parsed[0] || decoded
    } else {
      accessToken = decoded
    }
  } catch (e) {
    accessToken = tokenStr
  }

  if (!accessToken || typeof accessToken !== 'string' || !accessToken.includes('.')) {
    throw new Error("Unauthorized (Invalid Token Format)")
  }

  let user: any = {}
  try {
    const base64Url = accessToken.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
    user = JSON.parse(jsonPayload)
  } catch (e) {
    console.error("JWT Decode Error:", e)
    throw new Error("Unauthorized (JWT Decode Failed)")
  }

  const role = user.user_metadata?.role
  let userBranchId = user.user_metadata?.branch_id
  const userEmail = normalizeEmail(user.email)

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let isAdmin = role === 'admin' || isAdminEmail(userEmail)
  let isKitchen = role === 'kitchen' || role === 'kitchen_staff' || isHardcodedKitchenEmail(userEmail)

  if (!userBranchId && userEmail) {
    const { data: branchByEmail } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle()

    if (branchByEmail?.id) {
      userBranchId = branchByEmail.id
      isKitchen = true
    }
  }

  if (!userBranchId && user.sub) {
    const { data: branchByAuthId } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('id', user.sub)
      .maybeSingle()

    if (branchByAuthId?.id) {
      userBranchId = branchByAuthId.id
      isKitchen = true
    }
  }

  if (!isAdmin && !isKitchen) {
    throw new Error("Unauthorized role")
  }
  const effectiveRole = isAdmin ? 'admin' : (isKitchen ? 'kitchen' : role)

  // If kitchen, ensure they own the order
  let currentAddress = ""
  
  if (isKitchen || riderName) {
    const { data: order } = await supabaseAdmin.from('orders').select('branch_id, customer_address').eq('id', orderId).single()
    if (!order || (isKitchen && order.branch_id !== userBranchId)) {
      throw new Error("Unauthorized branch")
    }
    currentAddress = order.customer_address
  }

  // 4. Execute Update
  if (newStatus === 'cancelled') {
    const { error } = await supabaseAdmin.rpc('cancel_order', {
      p_order_id: orderId,
      p_actor_id: user.sub,
      p_actor_role: effectiveRole,
      p_notes: cancellationReason || 'No reason provided'
    })
    
    if (error) {
      console.error("Failed to cancel order via RPC:", error)
      // Fallback update
      const { error: fallbackError } = await supabaseAdmin.from('orders').update({ 
        status: 'cancelled', 
        cancellation_reason: cancellationReason 
      }).eq('id', orderId)
      if (fallbackError) throw new Error(fallbackError.message)
    }
  } else {
    // Normal status update
    const { error } = await supabaseAdmin.rpc('update_order_status_safe', {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_rider_name: riderName || null,
      p_cancellation_reason: cancellationReason || null,
      p_user_id: user.sub || null
    })

    if (error) {
      console.error("Failed to update in DB via RPC:", error)
      
      // Fallback if RPC is not created yet
      console.log("Attempting fallback update...")
    const updatePayload: any = { status: newStatus }
    
    // Track Turnaround Time (TAT)
    const now = new Date().toISOString()
    if (newStatus === 'preparing') updatePayload.accepted_at = now
    else if (newStatus === 'quality-check') updatePayload.prepared_at = now
    else if (newStatus === 'on-the-way') updatePayload.dispatched_at = now
    else if (newStatus === 'completed') updatePayload.delivered_at = now
    
    if (riderName) {
      const cleanAddress = currentAddress.split('[RIDER:')[0].trim()
      updatePayload.customer_address = `${cleanAddress} [RIDER:${riderName}]`
    }
    if (cancellationReason) updatePayload.cancellation_reason = cancellationReason

    const fallbackResult = await supabaseAdmin.from('orders').update(updatePayload).eq('id', orderId)
    if (fallbackResult.error) throw new Error(fallbackResult.error.message)
    
    await supabaseAdmin.from('audit_logs').insert([{
      user_id: user.sub,
      user_email: user.email || 'unknown',
      action: `ORDER_STATUS_CHANGED_${newStatus.toUpperCase()}`,
      target_id: orderId,
      details: { newStatus, riderName }
    }])
  }
  }

  return { success: true }
}

export async function createOrderAction(rawOrderData: any) {
  const orderData = sanitizeInput(rawOrderData)
  
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Rate Limiting (3 orders per IP per hour)
  if (ip !== 'unknown') {
    const { data: limitData } = await supabaseAdmin.from('rate_limits').select('*').eq('ip', ip).single()
    
    if (limitData) {
      const lastOrder = new Date(limitData.last_order_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60)

      if (hoursDiff < 1 && limitData.orders_count >= 3) {
        throw new Error("RATE_LIMIT_EXCEEDED")
      }

      if (hoursDiff >= 1) {
        await supabaseAdmin.from('rate_limits').update({ orders_count: 1, last_order_at: now.toISOString() }).eq('ip', ip)
      } else {
        await supabaseAdmin.from('rate_limits').update({ orders_count: limitData.orders_count + 1 }).eq('ip', ip)
      }
    } else {
      await supabaseAdmin.from('rate_limits').insert([{ ip, orders_count: 1 }])
    }
  }

  // Haversine Routing logic: Automatically assign nearest branch based on coordinates
  let finalBranchId = orderData.branch_id || null
  
  if (orderData.lat && orderData.lng) {
    const { data: nearestBranchId, error: branchError } = await supabaseAdmin.rpc('get_nearest_branch', {
      p_lat: orderData.lat,
      p_lng: orderData.lng
    })
    
    if (!branchError && nearestBranchId) {
      finalBranchId = nearestBranchId
    }
  }

  // Insert Order via ACID Transaction RPC
  const { data, error } = await supabaseAdmin.rpc('place_order_safe', {
    p_user_id: orderData.user_id,
    p_branch_id: finalBranchId,
    p_customer_name: orderData.customer_name,
    p_customer_phone: orderData.customer_phone || 'N/A',
    p_customer_address: orderData.customer_address,
    p_items: orderData.items,
    p_total: orderData.total,
    p_payment_method: orderData.payment_method,
    p_lat: orderData.lat || null,
    p_lng: orderData.lng || null
  })

  if (error || !data?.success) {
    console.error("Order Insert Error (RPC):", error || data?.error)
    
    // Fallback if RPC is missing
    console.log("Attempting fallback order insert...")
    const fallbackResult = await supabaseAdmin.from('orders').insert([orderData]).select().single()
    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message)
    }
    return { success: true, id: fallbackResult.data.id }
  }

  return { success: true, id: data?.order_id || data?.id || null }
}
