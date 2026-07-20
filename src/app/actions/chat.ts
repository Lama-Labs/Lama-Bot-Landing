'use server'

import { createStreamableValue } from '@ai-sdk/rsc'
import { auth } from '@clerk/nextjs/server'

import type { ChatRequestBody } from '@/app/api/chat/types'
import { CHAT_ERROR_CODE, getChatErrorCodeByStatus } from '@/utils/chat-errors'
import { hasAnyPlan } from '@/utils/clerk/subscription'
import { ANY_PAID_PLAN } from '@/utils/plans'
import { getUserData } from '@/utils/turso'

/**
 * Sent as `websiteContent` for dashboard/demo requests.
 * Only contains testing-specific context — all behavioral rules, custom instructions,
 * and date/time are already handled by the API route's system instructions.
 */
const dashboardContext = `You are in TESTING MODE. The administrator is evaluating how you will perform with real customers.

TESTING CONTEXT:
- This is a testing/preview environment where the admin tests the complete customer experience
- You have NO website context available - your ONLY knowledge source is the vector store with uploaded documents
- The admin is role-playing as a customer to see how you'll actually behave in production
- Treat every interaction as if it were a real customer conversation
- Respond AS IF speaking to a real customer (not as if reporting to the admin)`

type SubmitChatArgs = {
  threadId: string
  message: string
  assistantId: string | null
  lang: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
  useDashboardMode?: boolean
  timeZone?: string
}

export async function submitChatMessage(args: SubmitChatArgs): Promise<{
  // NOTE: this is a stream handle, not a final value
  text: ReturnType<typeof createStreamableValue<string>>['value']
}> {
  const {
    threadId,
    message,
    assistantId,
    lang,
    conversation,
    useDashboardMode = false,
    timeZone,
  } = args

  if (!threadId || !message) {
    throw new Error('Missing required fields: threadId or message')
  }

  let apiKey: string

  // Dashboard mode: use authenticated user's API key
  if (useDashboardMode) {
    const { userId, has } = await auth()

    if (!userId) {
      throw new Error(
        'Unauthorized: User must be signed in to use dashboard chat'
      )
    }

    // Check if user has an active subscription
    const hasActiveSubscription = await hasAnyPlan(has, ANY_PAID_PLAN, userId)
    if (!hasActiveSubscription) {
      throw new Error(CHAT_ERROR_CODE.SUBSCRIPTION_INVALID)
    }

    // Get user's API key from database
    const userData = await getUserData(userId)
    const userApiKey = userData?.apiKey
    if (!userApiKey) {
      throw new Error('No API key found. Please contact support.')
    }

    apiKey = userApiKey
    console.log(`[Dashboard Chat] User: ${userId}`)
  } else {
    // Demo mode: look up demo user from Turso (same flow as dashboard)
    const demoUserId = assistantId || 'alpacachat'
    const userData = await getUserData(demoUserId)
    if (!userData?.apiKey) {
      throw new Error(
        `Demo assistant "${demoUserId}" not configured in database`
      )
    }

    apiKey = userData.apiKey
    console.log(`[Demo Chat] Assistant: ${demoUserId}`)
  }

  // Build request body matching the /api/chat endpoint
  // Custom instructions are fetched and applied by the API route itself
  const requestBody: ChatRequestBody = {
    sessionId: threadId,
    websiteContent: dashboardContext,
    userMessage: message,
    conversation: conversation || [],
    language: lang,
    timeZone,
  }

  // Create streamable value for text
  const stream = createStreamableValue<string>('')

    ; (async () => {
      try {
        // Determine the base URL for the API call
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000'
        const apiUrl = `${baseUrl}/api/chat`

        // Call the /api/chat endpoint
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }

        // Bypass Vercel deployment protection on preview deployments
        const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
        if (bypassSecret) {
          headers['x-vercel-protection-bypass'] = bypassSecret
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const chatErrorCode = getChatErrorCodeByStatus(response.status)
          if (chatErrorCode) {
            throw new Error(chatErrorCode)
          }
          throw new Error(
            errorData.error || `API request failed with status ${response.status}`
          )
        }

        if (!response.body) {
          throw new Error('Response body is null')
        }

        // Stream the plain text response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          acc += chunk
          stream.update(acc)
        }

        stream.done()
      } catch (error) {
        console.error('Error calling /api/chat:', error)
        // Signal error so frontend catch block displays translated error message
        stream.error(error instanceof Error ? error.message : 'Unknown error')
      }
    })()

  // Return the text stream handle; the client will read it progressively
  return { text: stream.value }
}
