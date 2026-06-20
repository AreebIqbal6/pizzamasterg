import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    // 1. Find the latest valid OTP for this phone
    const { data: records, error } = await supabaseAdmin
      .from('otp_verifications')
      .select('id, expires_at, is_used')
      .eq('phone', phone)
      .eq('code', code)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !records || records.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid verification code' }, { status: 400 })
    }

    const record = records[0]

    if (record.is_used) {
      return NextResponse.json({ valid: false, error: 'Code has already been used' }, { status: 400 })
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Code has expired' }, { status: 400 })
    }

    // 2. Mark as used
    await supabaseAdmin
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', record.id)

    return NextResponse.json({ valid: true, message: 'Verification successful' })

  } catch (error: any) {
    console.error("Verify OTP Route Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
