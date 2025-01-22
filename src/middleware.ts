import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { getMessages } from 'next-intl/server'

import { routing } from './i18n/routing'

// Initialize next-intl middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest): Promise<NextResponse> {
  // Run the i18n middleware first
  const response = intlMiddleware(req)

  // Extract 'assistant_id' from query parameters
  const url = new URL(req.url)
  const assistantId = url.searchParams.get('assistant_id')

  // Get the locale from the request headers (fallback to 'en' if missing)
  const locale = req.headers.get('x-next-intl-locale') || 'en'

  try {
    // Fetch localized messages dynamically
    const messages = await getMessages({ locale })

    // Validate that 'assistant_id' exists in the locale's initialAssistants array
    const isValidAssistant = (
      messages as { chat?: { initialAssistants?: { id: string }[] } }
    )?.chat?.initialAssistants?.some(
      (assistant) => assistant.id === assistantId
    )

    // If valid, set the cookie with a 1-day expiration
    if (assistantId && isValidAssistant) {
      response.cookies.set('assistant_id', assistantId, {
        maxAge: 86400,
        sameSite: 'lax',
        secure: true,
      })
    }
  } catch (error) {
    console.error('Error fetching locale messages:', error)
  }

  return response
}

// Apply middleware only to internationalized paths
export const config = {
  matcher: ['/', '/(en|sl)/:path*'], // Matches only localized paths
}
