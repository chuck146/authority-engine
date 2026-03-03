import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedPrefixes = [
  '/dashboard',
  '/content',
  '/seo',
  '/reviews',
  '/community',
  '/analytics',
  '/settings',
]

const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth/callback')) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtected && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    const hasError = request.nextUrl.searchParams.has('error')
    if (!hasError) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
