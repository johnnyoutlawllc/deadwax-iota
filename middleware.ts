// Dead Wax Records — Auth middleware
// Johnny Outlaw, LLC — Designed in Rockwall, TX
//
// Protects /chi and /shop routes. Only johnnyoutlawllc@gmail.com may access.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_EMAIL = 'johnnyoutlawllc@gmail.com'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let the login page and auth callback through unconditionally
  if (pathname.startsWith('/chi/login') || pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
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

  // Not authenticated → send to login
  if (!user) {
    return NextResponse.redirect(new URL('/chi/login', request.url))
  }

  // Wrong email → send to login with error flag
  if (user.email !== ALLOWED_EMAIL) {
    return NextResponse.redirect(new URL('/chi/login?error=unauthorized', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/chi', '/chi/:path*', '/shop', '/shop/:path*'],
}
