'use server'

// eslint-disable-next-line import/named
import { createStreamableValue } from '@ai-sdk/rsc'
import { streamText } from 'ai'

import { getAssistantConfigById } from '@/utils/assistantsConfig'
import { openaiVercelClient } from '@/utils/openai-client'

type SubmitChatArgs = {
  threadId: string
  message: string
  assistantId: string | null
  lang: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
}

export async function submitChatMessage(args: SubmitChatArgs): Promise<{
  // NOTE: this is a stream handle, not a final value
  text: ReturnType<typeof createStreamableValue<string>>['value']
}> {
  const { threadId, message, assistantId, lang, conversation } = args

  if (!threadId || !message) {
    throw new Error('Missing required fields: threadId or message')
  }

  const baseInstructions =
    'You are a helpful assistant whose role is defined below. Always answer in the language of the user (specified in the square brackets at the beginning of the message, like "[lang]").'
  const assistantConfig = getAssistantConfigById(assistantId)

  const instructions = assistantConfig.instructions
    ? `${baseInstructions}\n\n${assistantConfig.instructions}`
    : baseInstructions

  const vectorStoreIds = assistantConfig.vectorStoreIds

  // Prefix user message with locale (preserving your current behavior)
  const userMessage = `[${lang}] ${message}`

  // Build OpenAI Responses API "tools" (file_search) if provided
  const openAiTools =
    vectorStoreIds && vectorStoreIds.length > 0
      ? [
        {
          type: 'file_search',
          vector_store_ids: vectorStoreIds,
          max_num_results: 20,
        },
      ]
      : undefined

  // Create streamable value for text
  const stream = createStreamableValue<string>('')

    ; (async () => {
      const { textStream } = await streamText({
        model: openaiVercelClient.responses('gpt-4o-mini'),
        system: instructions,
        // Provide full conversation if present; otherwise send only the current user message
        ...(Array.isArray(conversation) && conversation.length > 0
          ? { messages: conversation }
          : { prompt: userMessage }),

        // Pass-through OpenAI Responses API fields here:
        providerOptions: {
          openai: {
            store: true,
            // vector store id is used as a cache key for the prompt because each tenant has a different vector store
            ...(vectorStoreIds && vectorStoreIds.length > 0 ? { prompt_cache_key: vectorStoreIds[0] } : {}),
            text: { format: { type: 'text' } },
            ...(openAiTools
              ? { tools: openAiTools, tool_choice: 'auto' as const }
              : {}),
          },
        },
      })

      // Accumulate full text so the client can just render “what we have so far”
      let acc = ''
      for await (const chunk of textStream) {
        acc += chunk
        stream.update(acc)
      }
      stream.done()
    })()

  // Return the text stream handle; the client will read it progressively
  return { text: stream.value }
}
