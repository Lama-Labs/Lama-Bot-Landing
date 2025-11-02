import 'server-only'
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

type UserData = {
  clerkUserId: string
  email?: string | null
  apiKey?: string | null
  documentCount?: number | null
  totalStorageLimit?: number | null
  vectorStoreId?: string | null
}

type TableSchema = {
  name: string
  createStatement: string
  indexes?: string[]
}

const TABLE_SCHEMAS: TableSchema[] = [
  {
    name: 'usage_events',
    createStatement: `
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
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS idx_usage_events_user_created ON usage_events (clerk_user_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_usage_events_session_created ON usage_events (session_id, created_at)`,
    ],
  },
  {
    name: 'users',
    createStatement: `
      CREATE TABLE IF NOT EXISTS users (
        clerk_user_id TEXT PRIMARY KEY,
        email TEXT,
        api_key TEXT,
        document_count INTEGER,
        total_storage_limit INTEGER,
        vector_store_id TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS idx_users_api_key ON users (api_key)`,
    ],
  },
  {
    name: 'custom_instructions',
    createStatement: `
      CREATE TABLE IF NOT EXISTS custom_instructions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        clerk_user_id TEXT NOT NULL,
        instructions TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
      )
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS idx_custom_instructions_user ON custom_instructions (clerk_user_id)`,
    ],
  },
]

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
    // Create all tables and indexes from TABLE_SCHEMAS
    for (const schema of TABLE_SCHEMAS) {
      await client.execute(schema.createStatement)

      if (schema.indexes) {
        for (const indexStatement of schema.indexes) {
          await client.execute(indexStatement)
        }
      }
    }
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
              id,
              session_id, clerk_user_id, response_id, model,
              input_tokens, input_cached_tokens, output_tokens, output_reasoning_tokens, total_tokens,
              raw_usage_json
            ) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

/**
 * Upserts user data to the Turso database
 * If the user exists, updates only the provided fields
 * If the user doesn't exist, creates a new record
 */
export const upsertUser = async (userData: UserData): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    // Build the update fields dynamically based on what's provided
    const updates: string[] = []
    const values: (string | number | null)[] = []

    if (userData.email !== undefined) {
      updates.push('email = ?')
      values.push(userData.email)
    }
    if (userData.apiKey !== undefined) {
      updates.push('api_key = ?')
      values.push(userData.apiKey)
    }
    if (userData.documentCount !== undefined) {
      updates.push('document_count = ?')
      values.push(userData.documentCount)
    }
    if (userData.totalStorageLimit !== undefined) {
      updates.push('total_storage_limit = ?')
      values.push(userData.totalStorageLimit)
    }
    if (userData.vectorStoreId !== undefined) {
      updates.push('vector_store_id = ?')
      values.push(userData.vectorStoreId)
    }

    // Always update the updated_at timestamp
    updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")

    // SQLite UPSERT syntax: INSERT ... ON CONFLICT ... DO UPDATE
    const sql = `
      INSERT INTO users (clerk_user_id, email, api_key, document_count, total_storage_limit, vector_store_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(clerk_user_id) DO UPDATE SET ${updates.join(', ')}
    `

    await client.execute({
      sql,
      args: [
        userData.clerkUserId,
        userData.email ?? null,
        userData.apiKey ?? null,
        userData.documentCount ?? null,
        userData.totalStorageLimit ?? null,
        userData.vectorStoreId ?? null,
        ...values,
      ],
    })
  } catch (error) {
    console.error('[turso] Failed to upsert user', {
      clerkUserId: userData.clerkUserId,
      error: (error as Error).message,
    })
  }
}

/**
 * Saves or updates custom instructions for a user
 */
export const saveCustomInstructions = async (
  clerkUserId: string,
  instructions: string
): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    // Check if custom instructions already exist for this user
    const existing = await client.execute({
      sql: 'SELECT id FROM custom_instructions WHERE clerk_user_id = ? LIMIT 1',
      args: [clerkUserId],
    })

    if (existing.rows.length > 0) {
      // Update existing instructions
      await client.execute({
        sql: `UPDATE custom_instructions 
              SET instructions = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
              WHERE clerk_user_id = ?`,
        args: [instructions, clerkUserId],
      })
    } else {
      // Insert new instructions
      await client.execute({
        sql: `INSERT INTO custom_instructions (id, clerk_user_id, instructions)
              VALUES (lower(hex(randomblob(16))), ?, ?)`,
        args: [clerkUserId, instructions],
      })
    }
  } catch (error) {
    console.error('[turso] Failed to save custom instructions', {
      clerkUserId,
      error: (error as Error).message,
    })
  }
}

/**
 * Retrieves custom instructions for a user
 * Returns null if no instructions are found
 */
export const getCustomInstructions = async (
  clerkUserId: string
): Promise<string | null> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return null

    const result = await client.execute({
      sql: 'SELECT instructions FROM custom_instructions WHERE clerk_user_id = ? LIMIT 1',
      args: [clerkUserId],
    })

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0].instructions as string
  } catch (error) {
    console.error('[turso] Failed to get custom instructions', {
      clerkUserId,
      error: (error as Error).message,
    })
    return null
  }
}
