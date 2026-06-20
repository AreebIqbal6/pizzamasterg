import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const role = data.user.user_metadata?.role
      if (role === 'admin') return NextResponse.redirect(`${origin}/admin-dashboard`)
      if (role === 'kitchen_staff' || role === 'kitchen' || data.user.email?.toLowerCase().includes('pizzamasterg')) return NextResponse.redirect(`${origin}/kitchen-dashboard`)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/?error=auth-failed`)
}
