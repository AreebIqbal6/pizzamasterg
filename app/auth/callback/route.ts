import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSafeNextPath, isAdminAuthUser, isKitchenAuthUser, normalizeEmail } from '@/lib/auth/access'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeNextPath(searchParams.get('next'), '/')

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      if (isAdminAuthUser(data.user)) return NextResponse.redirect(`${origin}/admin-dashboard`)

      let isKitchen = isKitchenAuthUser(data.user)
      if (!isKitchen) {
        const { data: branchByEmail } = await supabase
          .from('branches')
          .select('id')
          .eq('email', normalizeEmail(data.user.email))
          .maybeSingle()
        isKitchen = !!branchByEmail
      }

      if (isKitchen) return NextResponse.redirect(`${origin}/kitchen-dashboard`)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  return NextResponse.redirect(`${origin}/?error=auth-failed`)
}
