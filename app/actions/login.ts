"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminAuthUser, isKitchenAuthUser, normalizeEmail } from "@/lib/auth/access"

export async function adminLoginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/admin-login?error=${encodeURIComponent(error.message)}`)
  }

  if (!isAdminAuthUser(data.user)) {
    await supabase.auth.signOut()
    redirect(`/admin-login?error=${encodeURIComponent("Access Denied: Not an admin account")}`)
  }

  redirect("/admin-dashboard")
}

export async function kitchenLoginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/kitchen-login?error=${encodeURIComponent(error.message)}`)
  }

  const userEmail = normalizeEmail(data.user?.email)
  const { data: branchByEmail } = await supabase
    .from("branches")
    .select("id")
    .eq("email", userEmail)
    .maybeSingle()

  const isAdmin = isAdminAuthUser(data.user)
  const isKitchen = isKitchenAuthUser(data.user) || !!branchByEmail

  if (!isAdmin && !isKitchen) {
    await supabase.auth.signOut()
    redirect(`/kitchen-login?error=${encodeURIComponent("Access Denied: Not a kitchen account")}`)
  }

  if (isAdmin) {
    redirect("/admin-dashboard")
  }
  redirect("/kitchen-dashboard")
}
