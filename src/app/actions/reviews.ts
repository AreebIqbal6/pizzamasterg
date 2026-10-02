"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export async function submitReview(orderId: string, rating: number, comment: string) {
  const supabaseAdmin = createAdminClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co'),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy')
  )

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabaseAdmin.from('reviews').insert({
    order_id: orderId,
    rating: rating,
    comment: comment.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
