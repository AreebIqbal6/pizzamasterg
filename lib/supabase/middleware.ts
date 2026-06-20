import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (path.startsWith('/api/')) {
    return supabaseResponse
  }
  
  // Find matching route config
  const routeMatch = ROUTE_CONFIG.find(route => path.startsWith(route.path))
  
  if (routeMatch) {
    if (!user) {
      const redirectUrl = new URL(routeMatch.fallback, request.url)
      redirectUrl.searchParams.set('next', path)
      return NextResponse.redirect(redirectUrl)
    }

    const userRole = user.user_metadata?.role || ''
    const userEmail = user.email?.toLowerCase() || ''
    
    const hasRequiredRole = routeMatch.requiredRoles.some(role => 
      userRole === role || 
      (role === 'admin' && userEmail === 'admin@pizzamasterg.com') ||
      (role === 'kitchen' && userEmail.includes('pizzamasterg'))
    )

    if (!hasRequiredRole) {
      const redirectUrl = new URL(routeMatch.fallback, request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
