import { type Client, createClient } from '@libsql/client'

export interface UsageDetails {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  input_tokens_details?: {
    cached_tokens?: number
  }
  output_tokens_details?: {
    reasoning_tokens?: number
  }
}

type SaveUsageEventParams = {
  sessionId?: string | null
  clerkUserId: string
  usage: UsageDetails | null | undefined
  responseId?: string | null
  model?: string | null
}

let cachedClient: Client | null = null
let initPromise: Promise<void> | null = null

const getClientOrNull = (): Client | null => {
  try {
    if (cachedClient) return cachedClient
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN
    if (!url) {
      console.warn(
        '[turso] TURSO_DATABASE_URL is not set; usage events will not be saved'
      )
      return null
    }
    cachedClient = createClient({ url, authToken })
    return cachedClient
  } catch (error) {
    console.error('[turso] Failed to create client', {
      error: (error as Error).message,
    })
    return null
  }
}

const ensureInitialized = async (): Promise<void> => {
  if (initPromise) return initPromise
  const client = getClientOrNull()
  if (!client) {
    initPromise = Promise.resolve()
    return initPromise
  }
  initPromise = (async () => {
    // Minimal schema to store token usage per call
    await client.execute(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        session_id TEXT,
        clerk_user_id TEXT NOT NULL,
        response_id TEXT,
        model TEXT,
        input_tokens INTEGER,
        input_cached_tokens INTEGER,
        output_tokens INTEGER,
        output_reasoning_tokens INTEGER,
        total_tokens INTEGER,
        raw_usage_json TEXT
      )
    `)
    await client.execute(
      `CREATE INDEX IF NOT EXISTS idx_usage_events_user_created ON usage_events (clerk_user_id, created_at)`
    )
    await client.execute(
      `CREATE INDEX IF NOT EXISTS idx_usage_events_session_created ON usage_events (session_id, created_at)`
    )
  })()
  return initPromise
}

const safeStringify = (value: unknown): string | null => {
  try {
    if (value == null) return null
    return JSON.stringify(value)
  } catch {
    return null
  }
}

export const saveUsageEvent = async (
  params: SaveUsageEventParams
): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    const inputTokens = params.usage?.input_tokens ?? null
    const outputTokens = params.usage?.output_tokens ?? null
    const totalTokens = params.usage?.total_tokens ?? null
    const inputCachedTokens =
      params.usage?.input_tokens_details?.cached_tokens ?? null
    const outputReasoningTokens =
      params.usage?.output_tokens_details?.reasoning_tokens ?? null

    await client.execute({
      sql: `INSERT INTO usage_events (
              session_id, clerk_user_id, response_id, model,
              input_tokens, input_cached_tokens, output_tokens, output_reasoning_tokens, total_tokens,
              raw_usage_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        params.sessionId ?? null,
        params.clerkUserId,
        params.responseId ?? null,
        params.model ?? null,
        inputTokens,
        inputCachedTokens,
        outputTokens,
        outputReasoningTokens,
        totalTokens,
        safeStringify(params.usage),
      ],
    })
  } catch (error) {
    console.error('[turso] Failed to save usage event', {
      error: (error as Error).message,
    })
  }
}
