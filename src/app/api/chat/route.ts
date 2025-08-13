/*
  Serverless POST handler for /api/chat that forwards messages to OpenAI Responses API
  and streams back only the text deltas as a plain text stream. Uses the official `openai` SDK.
*/

import { openaiClient } from '@/utils/openai-client'
import { clerkClient } from '@clerk/nextjs/server'
import type { User } from '@clerk/backend'

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

async function findUserByApiKey(apiKey: string) {
  // Paginates through Clerk users to find one with matching publicMetadata.apiKey
  // Intended for smaller instances. For large instances, consider maintaining a lookup table.
  const client = await clerkClient()
  const pageSize = 100
  let offset = 0

  let foundUser: User | null = null
  // Safeguard to avoid unbounded scans
  const maxScans = 20
  let scans = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const list = await client.users.getUserList({ limit: pageSize, offset })
    for (const u of list.data) {
      const storedKey =
        (u.publicMetadata?.apiKey as string | undefined) ?? undefined
      if (storedKey && storedKey === apiKey) {
        foundUser = u
        break
      }
    }

    if (foundUser) break

    const nextOffset = offset + list.data.length
    if (nextOffset >= list.totalCount) break

    offset = nextOffset
    scans += 1
    if (scans >= maxScans) break
  }

  return foundUser
}

export async function POST(request: Request) {
  const nowIso = () => new Date().toISOString()

  try {
    // Require Authorization: Bearer <api-key>
    const authHeader =
      request.headers.get('authorization') ??
      request.headers.get('Authorization')
    const isBearer =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    if (!isBearer) {
      return Response.json(
        { error: 'Unauthorized: missing Bearer token' },
        { status: 401, headers: { ...corsHeaders() } }
      )
    }
    const apiKey = authHeader!.slice('Bearer '.length).trim()
    if (!apiKey) {
      return Response.json(
        { error: 'Unauthorized: empty token' },
        { status: 401, headers: { ...corsHeaders() } }
      )
    }

    // Resolve Clerk user by API key stored in public metadata
    const user = await findUserByApiKey(apiKey)
    if (!user) {
      return Response.json(
        { error: 'Unauthorized: invalid API key' },
        { status: 401, headers: { ...corsHeaders() } }
      )
    }

    const vectorStoreId: string | null =
      (user.privateMetadata?.vectorStoreId as string | undefined) ?? null
    // TODO: check that subscription status is always set and implement a webhook to update it
    const subscriptionStatus: string | undefined = user.publicMetadata
      ?.subscriptionStatus as string | undefined
    const hasActiveSubscription = subscriptionStatus === 'active'

    if (!hasActiveSubscription) {
      return Response.json(
        { error: 'Unauthorized: user does not have an active subscription' },
        { status: 401, headers: { ...corsHeaders() } }
      )
    }

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

    const tools = vectorStoreId
      ? [
          {
            type: 'file_search' as const,
            vector_store_ids: [vectorStoreId],
            max_num_results: 20,
          },
        ]
      : []

    const sdkStream = await client.responses.stream({
      model: 'gpt-4o-mini',
      input: message,
      instructions: 'You are a helpful assistant.',
      ...(tools.length > 0 ? { tools } : {}),
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
