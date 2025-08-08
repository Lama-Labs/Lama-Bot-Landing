import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Optional: Define protected routes with Clerk
//const isProtectedRoute = createRouteMatcher(['/:locale/dashboarddddd(.*)']);
const isProtectedRoute = createRouteMatcher([])

// Export your middleware using Clerk's wrapper
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect() // only if you want protection on certain routes
  // Run your additional middleware (like next-intl)
  // skip internationalization for api routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  return intlMiddleware(req)
})

// Your matcher
export const config = {
  matcher: ['/', '/(en|sl)/:path*', '/api/:path*'],
}
