"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleSlammedMode(branchId: string, isSlammed: boolean, customEta: string) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Unauthorized")
  
  // Verify user has kitchen or admin role for this branch
  const role = user.user_metadata?.role
  const userBranchId = user.user_metadata?.branch_id
  
  if (role !== 'admin' && (role !== 'kitchen' || userBranchId !== branchId)) {
    throw new Error("Unauthorized branch access")
  }

  const { error } = await supabase
    .from("branch_settings")
    .upsert({ 
      branch_id: branchId, 
      is_slammed: isSlammed,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error("Error toggling slammed mode:", error)
    throw new Error(error.message)
  }

  revalidatePath('/kitchen-dashboard')
  revalidatePath('/')
  return { success: true }
}

export async function getBranchStatus(branchId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("branch_settings")
    .select("is_slammed")
    .eq("branch_id", branchId)
    .single()

  if (error || !data) {
    return { is_slammed: false, custom_eta: "30-45 mins" }
  }

  return { is_slammed: data.is_slammed, custom_eta: data.is_slammed ? "60-90 mins" : "30-45 mins" }
}
