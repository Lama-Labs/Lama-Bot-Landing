'use server'

// eslint-disable-next-line import/named
import { createStreamableValue } from '@ai-sdk/rsc'

import type { ChatRequestBody } from '@/app/api/chat/types'

type SubmitChatArgs = {
  threadId: string
  message: string
  assistantId: string | null
  lang: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
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
  const { threadId, message, assistantId, lang, conversation } = args

  if (!threadId || !message) {
    throw new Error('Missing required fields: threadId or message')
  }

  // Get the appropriate demo API key for this assistant
  const apiKey = getDemoApiKey(assistantId)

  console.log(`[Demo Chat] Selected assistant: ${assistantId}`)

  // Build request body matching the /api/chat endpoint
  const requestBody: ChatRequestBody = {
    sessionId: threadId,
    websiteContent: getAssistantInstructions(assistantId), // Assistant-specific instructions/context
    userMessage: message, // No [lang] prefix - handled by language field
    conversation: conversation || [],
    language: lang,
  }

  // Create streamable value for text
  const stream = createStreamableValue<string>('')

  ;(async () => {
    try {
      // Determine the base URL for the API call
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
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
