import type { AuthLikeUser } from "@/lib/auth/access"
import { normalizeEmail } from "@/lib/auth/access"

export type KitchenBranch = {
  id: string
  name?: string | null
}

export async function resolveKitchenBranch(supabase: any, user?: AuthLikeUser | null): Promise<KitchenBranch | null> {
  const metadataBranchId = user?.user_metadata?.branch_id

  if (metadataBranchId) {
    const { data } = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", metadataBranchId)
      .maybeSingle()

    if (data) return data
  }

  const email = normalizeEmail(user?.email)
  if (email) {
    const { data } = await supabase
      .from("branches")
      .select("id, name")
      .eq("email", email)
      .maybeSingle()

    if (data) return data
  }

  if (user?.id) {
    const { data } = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", user.id)
      .maybeSingle()

    if (data) return data
  }

  return null
}
