"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function toggleSlammedMode(branchId: string, isSlammed: boolean, customEta: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
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
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin
    .from("branch_settings")
    .select("is_slammed")
    .eq("branch_id", branchId)
    .single()

  if (error || !data) {
    return { is_slammed: false, custom_eta: "30-45 mins" }
  }

  // custom_eta is dynamically handled or could be added to branch_settings later
  return { is_slammed: data.is_slammed, custom_eta: data.is_slammed ? "60-90 mins" : "30-45 mins" }
}
