import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Extract tenant from subdomain
  const host = request.headers.get('host') || ''
  const baseDomain = process.env.BASE_DOMAIN || 'localhost:3000'
  
  let tenantSlug: string | null = null
  
  // In development, use mock tenant
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true') {
    tenantSlug = 'local-test'
  } else if (host !== baseDomain && host.endsWith(`.${baseDomain}`)) {
    tenantSlug = host.split('.')[0]
  }

  // Set tenant in cookie for server-side access
  if (tenantSlug) {
    response.cookies.set('x-tenant', tenantSlug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  // Handle auth routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return response
  }

  // Handle API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return response
  }

  // Handle marketing routes (no tenant required)
  if (request.nextUrl.pathname.startsWith('/marketing')) {
    return response
  }

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated and trying to access app
  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect to onboarding if authenticated but no tenant
  if (user && !tenantSlug && request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
