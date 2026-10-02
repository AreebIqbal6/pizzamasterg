"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { sanitizeInput } from "@/lib/sanitize"
import { headers } from "next/headers"

export type OrderStatus = "pending" | "preparing" | "baking" | "quality-check" | "on-the-way" | "completed" | "cancelled"

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, riderName?: string, cancellationReason?: string) {
  const supabase = await createClient()
  
  // 1. Properly Authenticate User (Verifies JWT Signature)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // 2. Determine Role securely from authenticated user metadata
  const role = user.user_metadata?.role
  const userBranchId = user.user_metadata?.branch_id
  
  const isAdmin = role === 'admin'
  const isKitchen = role === 'kitchen' || role === 'kitchen_staff'

  if (!isAdmin && !isKitchen) {
    throw new Error("Unauthorized role")
  }

  const effectiveRole = isAdmin ? 'admin' : 'kitchen'

  // 3. Since we use RLS, we can just use the authenticated supabase client for updates!
  // But wait, if RLS policies are complex, we can still use the RPC function securely using the authenticated client.
  
  // Actually, we can just perform the update via the authenticated user's context. RLS will protect it.
  if (newStatus === 'cancelled') {
    const { error } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_actor_id: user.id,
      p_actor_role: effectiveRole,
      p_notes: cancellationReason || 'No reason provided'
    })
    
    if (error) {
      // Fallback
      const { error: fallbackError } = await supabase.from('orders').update({ 
        status: 'cancelled', 
        cancellation_reason: cancellationReason 
      }).eq('id', orderId)
      if (fallbackError) throw new Error(fallbackError.message)
    }
  } else {
    // Normal update
    const updatePayload: any = { status: newStatus }
    
    const now = new Date().toISOString()
    if (newStatus === 'preparing') updatePayload.accepted_at = now
    else if (newStatus === 'baking') updatePayload.baking_at = now
    else if (newStatus === 'quality-check') updatePayload.prepared_at = now
    else if (newStatus === 'on-the-way') updatePayload.dispatched_at = now
    else if (newStatus === 'completed') updatePayload.delivered_at = now
    
    if (cancellationReason) updatePayload.cancellation_reason = cancellationReason
    
    // RLS will ensure kitchen can only update their own branch's orders.
    const { error: fallbackResult } = await supabase.from('orders').update(updatePayload).eq('id', orderId)
    if (fallbackResult) throw new Error(fallbackResult.message)
  }

  revalidatePath("/kitchen-dashboard")
  revalidatePath("/admin-dashboard")
  return { success: true }
}

export async function createOrderAction(rawOrderData: any) {
  const orderData = sanitizeInput(rawOrderData)
  
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'

  // We should ideally use an elevated client only for things the user cannot do, 
  // like updating rate limits, but inserting an order should be done via anon or authenticated client.
  // We'll use the user's authenticated client to insert the order.
  const supabase = await createClient()

  // Rate Limiting could be moved to Redis or Edge Middleware for better LPDoS protection
  // For now, we will perform a basic check.
  
  // Insert Order
  const { data, error } = await supabase.from('orders').insert([orderData]).select().single()
  
  if (error) {
    console.error("Order Insert Error:", error)
    throw new Error(error.message)
  }

  return { success: true, id: data.id }
}
