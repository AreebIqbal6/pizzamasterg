import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing keys" })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const emailsToDemote = ['user1@example.com', 'user2@example.com']
  const results = []
  
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    return NextResponse.json({ error })
  }
  
  for (const email of emailsToDemote) {
    const user = data.users.find(u => u.email === email)
    if (user) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: null }
      })
      results.push(updateError ? `Failed ${email}` : `Demoted ${email}`)
    } else {
      results.push(`Not found ${email}`)
    }
  }
  
  return NextResponse.json({ results })
}
