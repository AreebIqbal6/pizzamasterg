"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

import { sanitizeInput } from "@/lib/sanitize"

import { cookies } from "next/headers"
import { isAdminEmail, isHardcodedKitchenEmail, normalizeEmail } from "@/lib/auth/access"

async function getCurrentStaffAccess() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const cookieName = 'sb-vxfojrbieoocnkkntraa-auth-token'
  const tokenCookies = allCookies.filter(c => c.name.startsWith(cookieName)).sort((a, b) => a.name.localeCompare(b.name))

  if (tokenCookies.length === 0) {
    throw new Error("Not authenticated")
  }

  let tokenStr = tokenCookies.length === 1 && tokenCookies[0].name === cookieName
    ? tokenCookies[0].value
    : tokenCookies.map(c => c.value).join('')

  let accessToken = ""
  try {
    const decoded = decodeURIComponent(tokenStr)
    const parsed = JSON.parse(decoded)
    accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token
  } catch {
    accessToken = tokenStr
  }

  if (!accessToken || !accessToken.includes('.')) {
    throw new Error("Not authenticated")
  }

  const payload = accessToken.split('.')[1]
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const user = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
  const role = user.user_metadata?.role
  const email = normalizeEmail(user.email)
  let branchId = user.user_metadata?.branch_id

  let isAdmin = role === 'admin' || isAdminEmail(email)
  let isKitchen = role === 'kitchen' || role === 'kitchen_staff' || isHardcodedKitchenEmail(email)

  if (!branchId && email) {
    const { data: branchByEmail } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (branchByEmail?.id) {
      branchId = branchByEmail.id
      isKitchen = true
    }
  }

  if (!branchId && user.sub) {
    const { data: branchByAuthId } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('id', user.sub)
      .maybeSingle()

    if (branchByAuthId?.id) {
      branchId = branchByAuthId.id
      isKitchen = true
    }
  }

  if (!isAdmin && !isKitchen) {
    throw new Error("Unauthorized")
  }

  return { isAdmin, isKitchen, branchId }
}

export async function addRider(rawData: { name: string; phone: string; branch_id: string }) {
  const data = sanitizeInput(rawData)
  const access = await getCurrentStaffAccess()
  
  if (!access.isAdmin && data.branch_id !== access.branchId) {
    throw new Error("Cannot add rider to another branch")
  }
  
  const { error } = await supabaseAdmin
    .from('riders')
    .insert([
      { 
        name: data.name, 
        phone: data.phone, 
        branch_id: data.branch_id,
        is_active: true
      }
    ])

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/kitchen-dashboard/riders')
  return { success: true }
}

export async function toggleRiderStatus(id: string, currentStatus: boolean) {
  const access = await getCurrentStaffAccess()

  if (!access.isAdmin) {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('branch_id')
      .eq('id', id)
      .single()

    if (!rider || rider.branch_id !== access.branchId) {
      throw new Error("Cannot update rider from another branch")
    }
  }

  const { error } = await supabaseAdmin
    .from('riders')
    .update({ is_active: !currentStatus })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/kitchen-dashboard/riders')
  return { success: true }
}

export async function deleteRider(id: string) {
  const access = await getCurrentStaffAccess()

  if (!access.isAdmin) {
    const { data: rider } = await supabaseAdmin
      .from('riders')
      .select('branch_id')
      .eq('id', id)
      .single()

    if (!rider || rider.branch_id !== access.branchId) {
      throw new Error("Cannot delete rider from another branch")
    }
  }

  const { error } = await supabaseAdmin
    .from('riders')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/kitchen-dashboard/riders')
  return { success: true }
}

import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function getActiveRidersByBranch(branchId: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: riders, error } = await supabaseAdmin
    .from("riders")
    .select("id, name, phone")
    .eq("branch_id", branchId)
    .eq("is_active", true)

  if (error || !riders) {
    console.error("Error fetching riders:", error)
    return []
  }

  // Fetch active 'on-the-way' orders for this branch to calculate load dynamically
  const { data: activeOrders } = await supabaseAdmin
    .from("orders")
    .select("customer_address")
    .eq("branch_id", branchId)
    .eq("status", "on-the-way")

  const ridersWithLoad = riders.map(rider => {
    let current_load = 0
    if (activeOrders) {
      activeOrders.forEach(order => {
        if (order.customer_address && order.customer_address.includes(`[RIDER:${rider.name}]`)) {
          current_load++
        }
      })
    }
    return { ...rider, current_load, max_load: 5, status: 'available' }
  })

  return ridersWithLoad
}
