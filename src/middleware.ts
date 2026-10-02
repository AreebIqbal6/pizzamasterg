import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_ROUTES = [
  { path: '/admin-dashboard', roles: ['admin'], fallback: '/auth/admin' },
  { path: '/kitchen-dashboard', roles: ['kitchen', 'admin'], fallback: '/auth/kitchen' },
  { path: '/account', roles: ['customer', 'admin', 'kitchen'], fallback: '/?openAuth=true' }
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co'),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (path.startsWith('/api/')) return supabaseResponse

  const routeMatch = PROTECTED_ROUTES.find(route => path.startsWith(route.path))

  if (routeMatch) {
    if (!user) {
      const redirectUrl = new URL(routeMatch.fallback, request.url)
      redirectUrl.searchParams.set('next', path)
      return NextResponse.redirect(redirectUrl)
    }

    // Role Enforcement
    const role = user.user_metadata?.role || 'customer'
    if (!routeMatch.roles.includes(role)) {
      // User doesn't have the right role, send to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
