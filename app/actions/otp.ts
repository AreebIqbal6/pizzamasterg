"use server"

import { createClient } from "@/lib/supabase/server"
import { sanitizeInput } from "@/lib/sanitize"

import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function sendOtpToCustomer(rawPhone: string) {
  const phone = sanitizeInput(rawPhone)
  if (!phone) throw new Error("Invalid phone number")

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 mins
  
  // Delete existing records to avoid UNIQUE constraint requirements
  await supabaseAdmin
    .from('otp_verifications')
    .delete()
    .eq('phone', phone)

  // Insert the new OTP
  const { error } = await supabaseAdmin
    .from('otp_verifications')
    .insert({
      phone: phone,
      code: code,
      expires_at: expiresAt,
      is_used: false
    })

  if (error) {
    console.error("OTP generation error:", error)
    throw new Error("Failed to generate OTP")
  }

  // MVP: Simulate sending to Twilio / WhatsApp
  console.log(`[SMS/WhatsApp API SIMULATION] Sending OTP ${code} to ${phone}`)

  return { success: true, message: "OTP sent successfully", hint: code }
}

export async function verifyOtpAction(rawPhone: string, rawOtp: string) {
  const phone = sanitizeInput(rawPhone)
  const otp = sanitizeInput(rawOtp)

  if (!phone || !otp) throw new Error("Missing phone or OTP")

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data, error } = await supabaseAdmin
    .from('otp_verifications')
    .select('code, expires_at, is_used')
    .eq('phone', phone)
    .single()

  if (error || !data) {
    return { success: false, error: "Verification record not found" }
  }

  if (new Date(data.expires_at) < new Date()) {
    return { success: false, error: "OTP expired. Please request a new one." }
  }

  if (data.code !== otp) {
    return { success: false, error: "Invalid OTP code" }
  }

  // Mark verified
  await supabaseAdmin
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('phone', phone)

  return { success: true }
}
