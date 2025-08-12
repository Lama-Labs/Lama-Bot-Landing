/*
  Serverless POST handler for /api/chat that forwards messages to OpenAI Responses API
  and streams back only the text deltas as a plain text stream. Uses the official `openai` SDK.
*/

import { openaiClient } from '@/utils/openai-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ChatRequestBody = {
  sessionId?: string
  message?: string
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  } as const
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(),
    },
  })
}

export async function POST(request: Request) {
  const nowIso = () => new Date().toISOString()

  try {
    const { sessionId, message }: ChatRequestBody = await request
      .json()
      .catch(() => ({}))

    if (!message) {
      return Response.json(
        { error: 'Missing required field: message' },
        { status: 400, headers: { ...corsHeaders() } }
      )
    }

    const client = openaiClient

    const sdkStream = await client.responses.stream({
      model: 'gpt-4o',
      input: message,
      instructions: 'You are a helpful assistant.',
      tools: [
        {
          type: 'file_search',
          vector_store_ids: ['vs_688ab57c9b3c81919f2a5c730f12c06e'],
          max_num_results: 20,
        },
      ],
      tool_choice: 'auto',
      store: true,
      text: { format: { type: 'text' } },
      prompt_cache_key: sessionId,
    })

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder()
        console.log(
          `[${nowIso()}] OpenAI API response received successfully, starting stream...`
        )

        sdkStream.on('response.output_text.delta', (event: unknown) => {
          try {
            const deltaCandidate = (event as { delta?: unknown })?.delta
            const delta: string | undefined =
              typeof deltaCandidate === 'string' ? deltaCandidate : undefined
            if (typeof delta === 'string' && delta.length > 0) {
              controller.enqueue(encoder.encode(delta))
            }
          } catch (e) {
            console.error(`[${nowIso()}] Enqueue delta error`, {
              error: (e as Error).message,
            })
          }
        })

        sdkStream.on('response.completed', (event: unknown) => {
          console.log('response.completed', event)
        })

        sdkStream.on('end', async () => {
          try {
            await sdkStream.done()
          } catch {}
          controller.close()
          console.log(`[${nowIso()}] Chat request completed successfully`)
        })

        sdkStream.on('error', (err: unknown) => {
          console.error(`[${nowIso()}] Stream error`, {
            error: (err as Error).message,
          })
          try {
            controller.close()
          } catch {}
        })
      },
      cancel() {
        try {
          sdkStream.abort?.()
        } catch {}
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error(`[${nowIso()}] Chat request error`, {
      error: (error as Error).message,
    })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: { ...corsHeaders() } }
    )
  }
}
