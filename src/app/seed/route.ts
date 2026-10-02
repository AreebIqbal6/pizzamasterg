import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // USE SERVICE ROLE KEY to bypass RLS
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data: b, error: e1 } = await supabase.from('branches').select('*')
  
  if (b && b.length > 0) {
    return NextResponse.json({ message: 'Branches already exist', branches: b })
  }

  const { data, error } = await supabase.from('branches').insert([
    { name: 'Gulshan-e-Iqbal Block 2', location: 'Gulshan-e-Iqbal' },
    { name: 'North Karachi Anda Mor', location: 'North Karachi' },
    { name: 'F.B. Area Sagheer Center', location: 'FB Area' }
  ]).select()

  return NextResponse.json({ message: 'Seeded branches', data, error })
}
