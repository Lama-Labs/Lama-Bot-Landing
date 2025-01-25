import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import { handleAssistantLogic } from './middleware/assistants-middleware';
// import { handleImageRequests } from './middleware/email-middleware';

// Initialize next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest): Promise<NextResponse> {
  // Run the i18n middleware first
  const response = intlMiddleware(req)

  // Handle assistant logic
  await handleAssistantLogic(req, response);

  // Handle image requests
  // handleImageRequests(req);

  return response
}

// Apply middleware only to internationalized paths
export const config = {
  matcher: ['/', '/(en|sl)/:path*', ], // Matches only localized paths
}
