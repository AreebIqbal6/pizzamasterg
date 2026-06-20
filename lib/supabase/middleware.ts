import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeNextPath, isAdminAuthUser, isKitchenAuthUser, normalizeEmail } from '@/lib/auth/access'

const ROUTE_CONFIG = [
  { path: '/admin-dashboard', requiredRoles: ['admin'], fallback: '/admin-login' },
  { path: '/kitchen-dashboard', requiredRoles: ['kitchen', 'kitchen_staff', 'admin'], fallback: '/kitchen-login' },
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
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`

  if (path.startsWith('/api/')) {
    return supabaseResponse
  }
  
  // Find matching route config
  const routeMatch = ROUTE_CONFIG.find(route => path.startsWith(route.path))
  
  if (routeMatch) {
    if (!user) {
      const redirectUrl = new URL(routeMatch.fallback, request.url)
      redirectUrl.searchParams.set('next', getSafeNextPath(nextPath, routeMatch.path))
      return NextResponse.redirect(redirectUrl)
    }

    let hasRequiredRole = false

    if (routeMatch.path === '/admin-dashboard') {
      hasRequiredRole = isAdminAuthUser(user)
    } else if (routeMatch.path === '/kitchen-dashboard') {
      hasRequiredRole = isAdminAuthUser(user) || isKitchenAuthUser(user)

      if (!hasRequiredRole) {
        const { data: branchByEmail } = await supabase
          .from('branches')
          .select('id')
          .eq('email', normalizeEmail(user.email))
          .maybeSingle()

        hasRequiredRole = !!branchByEmail
      }
    }

    if (!hasRequiredRole) {
      const redirectUrl = new URL(routeMatch.fallback, request.url)
      redirectUrl.searchParams.set('next', getSafeNextPath(nextPath, routeMatch.path))
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
