import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  { path: '/admin-dashboard', fallback: '/admin-login' },
  { path: '/kitchen-dashboard', fallback: '/kitchen-login' },
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Skip API routes entirely
  if (path.startsWith('/api/')) {
    return supabaseResponse
  }

  // For protected routes: only require a logged-in session.
  // Role enforcement is handled by the login pages themselves.
  const routeMatch = PROTECTED_ROUTES.find(route => path.startsWith(route.path))

  if (routeMatch && !user) {
    const redirectUrl = new URL(routeMatch.fallback, request.url)
    redirectUrl.searchParams.set('next', path)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
