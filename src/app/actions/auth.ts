"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  isAdminEmail,
  isHardcodedKitchenEmail,
  normalizeEmail,
} from "@/lib/auth/access"

export type StaffPortal = "admin" | "kitchen" | null

export async function resolveStaffPortalByEmail(rawEmail: string): Promise<{
  portal: StaffPortal
}> {
  const email = normalizeEmail(rawEmail)
  if (!email || !email.includes("@")) return { portal: null }

  if (isAdminEmail(email)) return { portal: "admin" }
  if (isHardcodedKitchenEmail(email)) return { portal: "kitchen" }

  const { data: branchByEmail } = await supabaseAdmin
    .from("branches")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (branchByEmail) return { portal: "kitchen" }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (error || !data?.users) return { portal: null }

  const user = data.users.find((candidate) => normalizeEmail(candidate.email) === email)
  const role = String(user?.user_metadata?.role || "").toLowerCase()

  if (role === "admin") return { portal: "admin" }
  if (role === "kitchen" || role === "kitchen_staff") return { portal: "kitchen" }

  return { portal: null }
}
