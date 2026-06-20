"use server"

import { createClient } from "@/lib/supabase/server"

export async function validatePromoCode(code: string) {
  const supabase = createClient()
  
  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !promo) {
    return { valid: false, message: "Invalid promo code" }
  }

  const now = new Date()
  if (new Date(promo.expiry_date) < now) {
    return { valid: false, message: "Promo code has expired" }
  }

  if (promo.current_uses >= promo.max_uses) {
    return { valid: false, message: "Promo code usage limit reached" }
  }

  return { 
    valid: true, 
    discount_percentage: promo.discount_percentage 
  }
}

export async function recordPromoUsage(code: string) {
  const supabaseAdmin = createClient() // Service role ideally, but we'll use normal client and rely on triggers/policies
  // Actually, we must use the admin client if RLS blocks increments
  // I will just use an RPC or raw update using service role from order.ts where we have it.
}
