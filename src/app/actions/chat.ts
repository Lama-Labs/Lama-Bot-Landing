'use server'

// eslint-disable-next-line import/named
import { createStreamableValue } from '@ai-sdk/rsc'
import { auth, currentUser } from '@clerk/nextjs/server'

import type { ChatRequestBody } from '@/app/api/chat/types'
import { hasAnyPlan } from '@/utils/clerk/subscription'

const dashboardInstructions = `You are being tested in the dashboard by the website administrator who manages your knowledge base.

IMPORTANT CONTEXT:
- This is a testing environment where the admin evaluates your retrieval capabilities
- You have NO website context or page content available in dashboard mode
- Your ONLY source of knowledge is the vector store containing the admin's uploaded documents
- The admin wants to see how effectively you retrieve and present information from their files

YOUR PRIMARY GOALS:
1. Demonstrate excellent document retrieval from the vector store
2. Be completely transparent about what you find (or don't find) in the documents
3. Showcase your ability to synthesize information from multiple documents
4. Prove the value of the uploaded knowledge base

RESPONSE GUIDELINES:
- ALWAYS search the vector store thoroughly before responding
- If information exists in the documents, retrieve it and provide detailed, accurate answers with specifics
- When answering, reference that the information comes from the uploaded documents (e.g., "Based on your documentation..." or "According to the uploaded files...")
- If information is NOT in the documents, be honest: "I don't have that information in the uploaded documents. Please upload relevant files to help me answer this."
- NEVER make up or assume information - only use what's actually in the vector store
- If you find related information that partially answers the question, share it and explain what's missing
- Suggest related topics the admin might want to test based on what you discover in the documents

BEST PRACTICES:
- Ask clarifying questions if the query is ambiguous
- If multiple documents contain relevant info, synthesize them into a comprehensive answer
- Mention when you're drawing from multiple sources
- If the query can't be answered with current documents, suggest what types of files would help

Remember: The admin is evaluating whether their uploaded documents are working effectively and if you can retrieve the right information. Show off your capabilities!`

type SubmitChatArgs = {
  threadId: string
  message: string
  assistantId: string | null
  lang: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
  useDashboardMode?: boolean
}

function getDemoApiKey(assistantId: string | null): string {
  const normalizedId = assistantId || 'alpacachat'

  const apiKeysJson = process.env.DEMO_API_KEYS
  if (!apiKeysJson) {
    throw new Error('DEMO_API_KEYS environment variable is not configured')
  }

  let apiKeys: Record<string, string>
  try {
    apiKeys = JSON.parse(apiKeysJson)
  } catch (_error) {
    throw new Error('DEMO_API_KEYS is not valid JSON')
  }

  const key = apiKeys[normalizedId]
  if (!key) {
    throw new Error(`No API key found for assistant: ${normalizedId}`)
  }

  return key
}

function getAssistantInstructions(assistantId: string | null): string {
  const normalizedId = assistantId || 'alpacachat'

  const instructions: Record<string, string> = {
    alpacachat:
      'You are the assistant for the Alpaca Chat website. Answer questions about the site, its product (Alpaca Chat), features, pricing, setup, and usage. Be concise, accurate, and helpful. If something is unclear or unknown, ask a clarifying question or say that you do not know.',
    gym: 'You are a fitness assistant. Answer questions about workout programs, membership options, and opening hours based on the vector store information.',
    wristway:
      'You help with Wristway, an ergonomic wrist rest. Use the vector store information to answer product features, usage, and benefits.',
  }

  return instructions[normalizedId] || instructions['alpacachat']
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

  // Dashboard mode: use authenticated user's API key
  if (useDashboardMode) {
    const { userId, has } = await auth()

    if (!userId) {
      throw new Error(
        'Unauthorized: User must be signed in to use dashboard chat'
      )
    }

    const user = await currentUser()
    if (!user) {
      throw new Error('User not found')
    }

    // Check if user has an active subscription
    const hasActiveSubscription = hasAnyPlan(has, 'basic', user.publicMetadata)
    if (!hasActiveSubscription) {
      throw new Error('Unauthorized: Active subscription required')
    }

    // Get user's API key from metadata
    const userApiKey = user.publicMetadata?.apiKey as string | undefined
    if (!userApiKey) {
      throw new Error('No API key found. Please contact support.')
    }

    apiKey = userApiKey
    console.log(`[Dashboard Chat] User: ${userId}`)
  } else {
    // Demo mode: use demo API keys
    apiKey = getDemoApiKey(assistantId)
    console.log(`[Demo Chat] Selected assistant: ${assistantId}`)
  }

  // Build request body matching the /api/chat endpoint
  const requestBody: ChatRequestBody = {
    sessionId: threadId,
    websiteContent: useDashboardMode
      ? dashboardInstructions
      : getAssistantInstructions(assistantId), // Assistant-specific instructions/context
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
