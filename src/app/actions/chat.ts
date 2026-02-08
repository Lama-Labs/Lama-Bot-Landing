'use server'

import { createStreamableValue } from '@ai-sdk/rsc'
import { auth } from '@clerk/nextjs/server'

import { getCustomInstructionsAction } from '@/app/actions/custom-instructions'
import type { ChatRequestBody } from '@/app/api/chat/types'
import { hasAnyPlan } from '@/utils/clerk/subscription'
import { getCustomInstructions, getUserData } from '@/utils/turso'

const getDashboardInstructions = (
  adminCustomInstructions: string
) => `You are in TESTING MODE in the admin dashboard. The administrator is evaluating how you will perform with real customers.

TESTING CONTEXT:
- This is a testing/preview environment where the admin tests the complete customer experience
- You have NO website context available - your ONLY knowledge source is the vector store with uploaded documents
- The admin is role-playing as a customer to see how you'll actually behave in production
- Treat every interaction as if it were a real customer conversation

YOUR PRIMARY GOALS:
1. Act exactly as you would with a real customer - apply all custom instructions naturally
2. Retrieve and use information from the uploaded documents seamlessly
3. Demonstrate your full capabilities: tone, personality, helpfulness, and accuracy
4. Show how effectively the knowledge base supports customer interactions

HOW TO RESPOND:
- Respond AS IF speaking to a real customer (not as if reporting to the admin)
- Use the tone, personality, and style defined in your custom instructions
- ALWAYS search the vector store for relevant information before responding
- Integrate document information naturally into customer-friendly responses
- If information exists in documents, provide detailed, helpful answers
- If information is NOT in documents, respond as you would to a real customer: acknowledge the limitation and offer alternatives or suggest they contact support
- NEVER make up information - only use what's in the vector store
- Ask clarifying questions when needed, just as you would with a customer

TRANSPARENCY (for testing purposes):
- If you can't find information in the documents, briefly mention this limitation: "I don't have that information in my current knowledge base" (customer-friendly, not "uploaded documents")
- If you find partial information, use it and naturally indicate what else might be helpful

DATE AND TIME:
- The current date and time is ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}	

Remember: The admin wants to see the REAL customer experience. Show off your personality, helpfulness, and how well you use the knowledge base in natural conversation!
${
  adminCustomInstructions
    ? `
---

ADMIN'S CUSTOM INSTRUCTIONS:
${adminCustomInstructions}

Apply these instructions fully - act as the assistant described above. The admin is testing you by simulating real customer scenarios, so embody this role completely.`
    : ''
}`

type SubmitChatArgs = {
  threadId: string
  message: string
  assistantId: string | null
  lang: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
  useDashboardMode?: boolean
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
  } = args

  if (!threadId || !message) {
    throw new Error('Missing required fields: threadId or message')
  }

  let apiKey: string

  let customInstructions = ''

  // Dashboard mode: use authenticated user's API key
  if (useDashboardMode) {
    const { userId, has } = await auth()

    if (!userId) {
      throw new Error(
        'Unauthorized: User must be signed in to use dashboard chat'
      )
    }

    // Check if user has an active subscription
    const hasActiveSubscription = await hasAnyPlan(has, 'basic', userId)
    if (!hasActiveSubscription) {
      throw new Error('Unauthorized: Active subscription required')
    }

    // Get user's API key from database
    const userData = await getUserData(userId)
    const userApiKey = userData?.apiKey
    if (!userApiKey) {
      throw new Error('No API key found. Please contact support.')
    }

    // Fetch custom instructions for the user (centralized via server action)
    customInstructions = (await getCustomInstructionsAction()) || ''

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
    customInstructions = (await getCustomInstructions(demoUserId)) || ''
    console.log(`[Demo Chat] Assistant: ${demoUserId}`)
  }

  // Build request body matching the /api/chat endpoint
  const requestBody: ChatRequestBody = {
    sessionId: threadId,
    websiteContent: getDashboardInstructions(customInstructions),
    userMessage: message, // No [lang] prefix - handled by language field
    conversation: conversation || [],
    language: lang,
  }

  // Create streamable value for text
  const stream = createStreamableValue<string>('')

  ;(async () => {
    try {
      // Determine the base URL for the API call
      const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'
      const apiUrl = `${baseUrl}/api/chat`

      // Call the /api/chat endpoint
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
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
