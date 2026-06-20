import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Ensure Twilio variables exist
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // 2. Set expiry (e.g., 5 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    // 3. Save to database securely using the Admin client
    const { error: dbError } = await supabaseAdmin.from('otp_verifications').insert([
      {
        phone,
        code: otp,
        expires_at: expiresAt.toISOString(),
      }
    ])

    if (dbError) {
      console.error("OTP Insert Error:", dbError)
      return NextResponse.json({ error: 'Failed to generate OTP securely' }, { status: 500 })
    }

    // 4. Send via Twilio
    if (accountSid && authToken && twilioPhone) {
      const client = twilio(accountSid, authToken)
      await client.messages.create({
        body: `Your Pizza Master G verification code is: ${otp}. It expires in 5 minutes.`,
        from: twilioPhone,
        to: phone
      })
    } else {
      console.warn("Twilio variables not set! Falling back to logging OTP for development:")
      console.log(`[MOCK SMS] To: ${phone} | Code: ${otp}`)
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' })

  } catch (error: any) {
    console.error("Send OTP Route Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
