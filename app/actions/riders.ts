"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

import { sanitizeInput } from "@/lib/sanitize"

import { cookies } from "next/headers"

export async function addRider(rawData: { name: string; phone: string; branch_id: string }) {
  const data = sanitizeInput(rawData)
  
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('sb-vxfojrbieoocnkkntraa-auth-token')
  
  if (!authCookie) {
    throw new Error("Not authenticated (No cookie)")
  }

  let user
  try {
    const cookieData = JSON.parse(authCookie.value)
    const accessToken = Array.isArray(cookieData) ? cookieData[0] : cookieData.access_token

    if (!accessToken) throw new Error("Not authenticated (No token)")

    const payload = accessToken.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
    user = JSON.parse(jsonPayload)
  } catch (e) {
    throw new Error("Not authenticated (Decode failed)")
  }
  
  if (!user) throw new Error("Not authenticated")
  
  const role = user.user_metadata?.role
  const userBranchId = user.user_metadata?.branch_id
  
  if (role !== 'admin' && role !== 'kitchen' && role !== 'kitchen_staff') {
    throw new Error("Unauthorized")
  }
  
  if (role !== 'admin' && data.branch_id !== userBranchId) {
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
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('sb-vxfojrbieoocnkkntraa-auth-token')
  if (!authCookie) throw new Error("Not authenticated")

  let user
  try {
    const cookieData = JSON.parse(authCookie.value)
    const accessToken = Array.isArray(cookieData) ? cookieData[0] : cookieData.access_token
    const payload = accessToken.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    user = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
  } catch (e) {
    throw new Error("Not authenticated")
  }
  if (!user) throw new Error("Not authenticated")

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
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('sb-vxfojrbieoocnkkntraa-auth-token')
  if (!authCookie) throw new Error("Not authenticated")

  let user
  try {
    const cookieData = JSON.parse(authCookie.value)
    const accessToken = Array.isArray(cookieData) ? cookieData[0] : cookieData.access_token
    const payload = accessToken.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    user = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
  } catch (e) {
    throw new Error("Not authenticated")
  }
  if (!user) throw new Error("Not authenticated")

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
