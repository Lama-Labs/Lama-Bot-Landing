import 'server-only'
import { type Client, createClient } from '@libsql/client'

import {
  ActivePlanPeriod,
  getActivePlanPeriodByUserId,
} from './clerk/subscription'
import { ANY_PAID_PLAN, TRIAL_LENGTH_MS } from './plans'

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

export type UserData = {
  clerkUserId: string
  email?: string | null
  apiKey?: string | null
  documentCount?: number | null
  totalStorageLimit?: number | null
  monthlyTokenLimit?: number | null
  vectorStoreId?: string | null
  trial?: string | null
  crawlEnabled?: number | null
  crawlMaxPages?: number | null
  crawlCooldownDays?: number | null
}

export type TokenUsageData = {
  id: string
  clerkUserId: string
  periodStart: string
  periodEnd: string
  tokenQuota: number
  usedTokens: number
  createdAt: string
  updatedAt: string
}

export type TokenQuotaCheckResult = {
  allowed: boolean
  tokenUsageId: string
}

export type WebsiteKnowledgeData = {
  id: string
  clerkUserId: string
  url: string
  status: 'pending' | 'completed' | 'failed'
  errorMessage: string | null
  crawlId: string | null
  vectorStoreFileId: string | null
  lastCrawledAt: string | null
  createdAt: string
  updatedAt: string
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
        monthly_token_limit INTEGER DEFAULT 0,
        vector_store_id TEXT,
        trial TEXT,
        crawl_enabled INTEGER DEFAULT 0,
        crawl_max_pages INTEGER DEFAULT 0,
        crawl_cooldown_days INTEGER DEFAULT 30,
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
  {
    name: 'token_usage',
    createStatement: `
      CREATE TABLE IF NOT EXISTS TokenUsage (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        clerk_user_id TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        token_quota INTEGER NOT NULL,
        used_tokens INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
      )
    `,
    indexes: [
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_token_usage_user_period ON TokenUsage (clerk_user_id, period_start)`,
    ],
  },
  {
    name: 'website_knowledge',
    createStatement: `
      CREATE TABLE IF NOT EXISTS website_knowledge (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        clerk_user_id TEXT NOT NULL,
        url TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        crawl_id TEXT,
        vector_store_file_id TEXT,
        last_crawled_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_user_id)
      )
    `,
    indexes: [
      `CREATE INDEX IF NOT EXISTS idx_website_knowledge_user ON website_knowledge (clerk_user_id)`,
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

/**
 * Advances a UTC timestamp by one calendar month while preserving the current time-of-day.
 * Used to define the end of a token quota period.
 */
const addOneMonth = (date: Date): Date => {
  const next = new Date(date)
  next.setUTCMonth(next.getUTCMonth() + 1)
  return next
}

/**
 * Returns true when `now` is within the token usage period, inclusive of `periodStart`
 * and exclusive of `periodEnd`.
 */
const isDateWithinPeriod = (
  now: Date,
  periodStartIso: string,
  periodEndIso: string
): boolean => {
  const periodStart = new Date(periodStartIso)
  const periodEnd = new Date(periodEndIso)
  return now >= periodStart && now < periodEnd
}

/**
 * Maps a TokenUsage database row to the application shape used by quota helpers.
 */
const mapRowToTokenUsageData = (
  row: Record<string, unknown>
): TokenUsageData => ({
  id: row.id as string,
  clerkUserId: row.clerk_user_id as string,
  periodStart: row.period_start as string,
  periodEnd: row.period_end as string,
  tokenQuota: row.token_quota as number,
  usedTokens: row.used_tokens as number,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
})

/**
 * Returns the most recently ending token usage period for a user.
 * This is the starting point for determining whether the current request falls
 * inside an active quota window or needs a new one.
 */
const getLatestTokenUsage = async (
  client: Client,
  clerkUserId: string
): Promise<TokenUsageData | null> => {
  const result = await client.execute({
    sql: `SELECT id, clerk_user_id, period_start, period_end, token_quota, used_tokens, created_at, updated_at
          FROM TokenUsage
          WHERE clerk_user_id = ?
          ORDER BY period_end DESC
          LIMIT 1`,
    args: [clerkUserId],
  })

  if (result.rows.length === 0) {
    return null
  }

  return mapRowToTokenUsageData(result.rows[0] as Record<string, unknown>)
}

/**
 * Looks up a user's token usage period by its exact `period_start` timestamp.
 * This is used to safely read back a period row after inserting it with a known start.
 */
const getTokenUsageByPeriodStart = async (
  client: Client,
  clerkUserId: string,
  periodStart: string
): Promise<TokenUsageData | null> => {
  const result = await client.execute({
    sql: `SELECT id, clerk_user_id, period_start, period_end, token_quota, used_tokens, created_at, updated_at
          FROM TokenUsage
          WHERE clerk_user_id = ? AND period_start = ?
          LIMIT 1`,
    args: [clerkUserId, periodStart],
  })

  if (result.rows.length === 0) {
    return null
  }

  return mapRowToTokenUsageData(result.rows[0] as Record<string, unknown>)
}

/**
 * Ensures a token usage row exists for the exact period boundary that was already
 * chosen by the caller. The row snapshots the user's quota for that period so later
 * allowance changes do not retroactively modify past usage windows.
 */
const createTokenUsagePeriod = async (
  client: Client,
  clerkUserId: string,
  tokenQuota: number,
  periodStart: string,
  periodEnd: string
): Promise<TokenUsageData> => {
  await client.execute({
    sql: `INSERT OR IGNORE INTO TokenUsage (
            id,
            clerk_user_id,
            period_start,
            period_end,
            token_quota,
            used_tokens
          ) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, 0)`,
    args: [clerkUserId, periodStart, periodEnd, tokenQuota],
  })

  const created = await getTokenUsageByPeriodStart(client, clerkUserId, periodStart)
  if (!created) {
    throw new Error('Failed to create token usage period')
  }

  return created
}

/**
 * Resolves the TokenUsage window that should apply to the current request from the
 * active Clerk/trial billing period. If a latest Turso record exists, the next
 * window continues from that period end when still inside the same billing cycle.
 */
const resolveTokenUsageWindow = (
  now: Date,
  activePlanPeriod: ActivePlanPeriod,
  latestTokenUsage?: TokenUsageData | null
): { periodStart: string; periodEnd: string } | null => {
  const billingPeriodStart = new Date(activePlanPeriod.periodStart)
  const billingPeriodEnd = new Date(activePlanPeriod.periodEnd)

  if (!(now >= billingPeriodStart && now < billingPeriodEnd)) {
    return null
  }

  if (activePlanPeriod.planPeriod === 'month') {
    return {
      periodStart: billingPeriodStart.toISOString(),
      periodEnd: billingPeriodEnd.toISOString(),
    }
  }

  let periodStart = latestTokenUsage
    ? new Date(latestTokenUsage.periodEnd)
    : new Date(billingPeriodStart)

  if (periodStart < billingPeriodStart) {
    periodStart = billingPeriodStart
  }

  // Walk monthly quota windows inside the active billing period until we reach
  // the window that should contain the current request time.
  while (periodStart < billingPeriodEnd) {
    const uncappedPeriodEnd = addOneMonth(periodStart)
    const periodEnd =
      uncappedPeriodEnd > billingPeriodEnd
        ? billingPeriodEnd
        : uncappedPeriodEnd

    if (now < periodEnd) {
      return {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      }
    }

    periodStart = uncappedPeriodEnd
  }

  return null
}

const resolveTrialTokenUsageWindow = (
  now: Date,
  user: UserData
): { periodStart: string; periodEnd: string } | null => {
  if (
    !user.trial ||
    !ANY_PAID_PLAN.includes(user.trial as (typeof ANY_PAID_PLAN)[number])
  ) {
    return null
  }

  return {
    periodStart: now.toISOString(),
    periodEnd: new Date(now.getTime() + TRIAL_LENGTH_MS).toISOString(),
  }
}

/**
 * Resolves the current token quota window for the user from Turso first and only
 * consults Clerk/trial billing metadata when a new TokenUsage row must be created.
 */
export const checkUserTokenQuota = async (
  clerkUserId: string
): Promise<TokenQuotaCheckResult | null> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return null

    const user = await getUserData(clerkUserId)
    if (!user) return null

    const tokenQuota = user.monthlyTokenLimit ?? 0
    const now = new Date()
    let activeTokenUsage = await getLatestTokenUsage(client, clerkUserId)

    if (
      !activeTokenUsage ||
      !isDateWithinPeriod(
        now,
        activeTokenUsage.periodStart,
        activeTokenUsage.periodEnd
      )
    ) {
      const activePlanPeriod = await getActivePlanPeriodByUserId(
        clerkUserId,
        ANY_PAID_PLAN
      )

      const tokenWindow = activePlanPeriod
        ? resolveTokenUsageWindow(now, activePlanPeriod, activeTokenUsage)
        : resolveTrialTokenUsageWindow(now, user)
      if (!tokenWindow) return null

      activeTokenUsage = await createTokenUsagePeriod(
        client,
        clerkUserId,
        tokenQuota,
        tokenWindow.periodStart,
        tokenWindow.periodEnd
      )
    }

    if (!activeTokenUsage) return null

    const usedTokens = activeTokenUsage.usedTokens
    return {
      allowed: usedTokens < activeTokenUsage.tokenQuota,
      tokenUsageId: activeTokenUsage.id,
    }
  } catch (error) {
    console.error('[turso] Failed to check user token quota', {
      clerkUserId,
      error: (error as Error).message,
    })
    return null
  }
}

/**
 * Increments usage on the already-authorized TokenUsage period after the chat response
 * completes. This intentionally allows a request that was valid at preflight time even
 * if the final token total pushes the user over quota.
 */
export const incrementTokenUsage = async (
  tokenUsageId: string,
  tokenCount: number
): Promise<void> => {
  try {
    if (tokenCount <= 0) return

    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    await client.execute({
      sql: `UPDATE TokenUsage
            SET used_tokens = used_tokens + ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = ?`,
      args: [tokenCount, tokenUsageId],
    })
  } catch (error) {
    console.error('[turso] Failed to increment token usage', {
      tokenUsageId,
      tokenCount,
      error: (error as Error).message,
    })
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
    if (userData.monthlyTokenLimit !== undefined) {
      updates.push('monthly_token_limit = ?')
      values.push(userData.monthlyTokenLimit)
    }
    if (userData.vectorStoreId !== undefined) {
      updates.push('vector_store_id = ?')
      values.push(userData.vectorStoreId)
    }
    if (userData.trial !== undefined) {
      updates.push('trial = ?')
      values.push(userData.trial)
    }
    if (userData.crawlEnabled !== undefined) {
      updates.push('crawl_enabled = ?')
      values.push(userData.crawlEnabled)
    }
    if (userData.crawlMaxPages !== undefined) {
      updates.push('crawl_max_pages = ?')
      values.push(userData.crawlMaxPages)
    }
    if (userData.crawlCooldownDays !== undefined) {
      updates.push('crawl_cooldown_days = ?')
      values.push(userData.crawlCooldownDays)
    }

    // Always update the updated_at timestamp
    updates.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")

    // SQLite UPSERT syntax: INSERT ... ON CONFLICT ... DO UPDATE
    const sql = `
      INSERT INTO users (clerk_user_id, email, api_key, document_count, total_storage_limit, monthly_token_limit, vector_store_id, trial, crawl_enabled, crawl_max_pages, crawl_cooldown_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        userData.monthlyTokenLimit ?? 0,
        userData.vectorStoreId ?? null,
        userData.trial ?? null,
        userData.crawlEnabled ?? 0,
        userData.crawlMaxPages ?? 0,
        userData.crawlCooldownDays ?? 30,
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

/**
 * Helper to map a database row to UserData
 */
const mapRowToUserData = (row: Record<string, unknown>): UserData => ({
  clerkUserId: row.clerk_user_id as string,
  email: row.email as string | null,
  apiKey: row.api_key as string | null,
  documentCount: row.document_count as number | null,
  totalStorageLimit: row.total_storage_limit as number | null,
  monthlyTokenLimit: row.monthly_token_limit as number | null,
  vectorStoreId: row.vector_store_id as string | null,
  trial: row.trial as string | null,
  crawlEnabled: row.crawl_enabled as number | null,
  crawlMaxPages: row.crawl_max_pages as number | null,
  crawlCooldownDays: row.crawl_cooldown_days as number | null,
})

/**
 * Retrieves user data by Clerk user ID
 * Returns null if user is not found or database is unavailable
 */
export const getUserData = async (
  clerkUserId: string
): Promise<UserData | null> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return null

    const result = await client.execute({
      sql: `SELECT clerk_user_id, email, api_key, document_count, total_storage_limit, monthly_token_limit, vector_store_id, trial, crawl_enabled, crawl_max_pages, crawl_cooldown_days
            FROM users WHERE clerk_user_id = ? LIMIT 1`,
      args: [clerkUserId],
    })

    if (result.rows.length === 0) {
      return null
    }

    return mapRowToUserData(result.rows[0] as Record<string, unknown>)
  } catch (error) {
    console.error('[turso] Failed to get user data', {
      clerkUserId,
      error: (error as Error).message,
    })
    return null
  }
}

/**
 * Retrieves user data by API key
 * Uses indexed lookup for fast queries - replaces slow Clerk pagination
 * Returns null if user is not found or database is unavailable
 */
export const getUserByApiKey = async (
  apiKey: string
): Promise<UserData | null> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return null

    const result = await client.execute({
      sql: `SELECT clerk_user_id, email, api_key, document_count, total_storage_limit, monthly_token_limit, vector_store_id, trial, crawl_enabled, crawl_max_pages, crawl_cooldown_days
            FROM users WHERE api_key = ? LIMIT 1`,
      args: [apiKey],
    })

    if (result.rows.length === 0) {
      return null
    }

    return mapRowToUserData(result.rows[0] as Record<string, unknown>)
  } catch (error) {
    console.error('[turso] Failed to get user by API key', {
      error: (error as Error).message,
    })
    return null
  }
}

/**
 * Deletes a user from the database by Clerk user ID
 * Also deletes associated custom_instructions
 */
export const deleteUser = async (clerkUserId: string): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    // Delete related records first (foreign key constraints)
    await client.execute({
      sql: 'DELETE FROM custom_instructions WHERE clerk_user_id = ?',
      args: [clerkUserId],
    })
    await client.execute({
      sql: 'DELETE FROM website_knowledge WHERE clerk_user_id = ?',
      args: [clerkUserId],
    })
    await client.execute({
      sql: 'DELETE FROM TokenUsage WHERE clerk_user_id = ?',
      args: [clerkUserId],
    })

    // Delete user
    await client.execute({
      sql: 'DELETE FROM users WHERE clerk_user_id = ?',
      args: [clerkUserId],
    })

    console.log(`[turso] User deleted: ${clerkUserId}`)
  } catch (error) {
    console.error('[turso] Failed to delete user', {
      clerkUserId,
      error: (error as Error).message,
    })
  }
}

// ── Website Knowledge CRUD ──────────────────────────────────────────

const mapRowToWebsiteKnowledge = (
  row: Record<string, unknown>
): WebsiteKnowledgeData => ({
  id: row.id as string,
  clerkUserId: row.clerk_user_id as string,
  url: row.url as string,
  status: row.status as WebsiteKnowledgeData['status'],
  errorMessage: row.error_message as string | null,
  crawlId: row.crawl_id as string | null,
  vectorStoreFileId: row.vector_store_file_id as string | null,
  lastCrawledAt: row.last_crawled_at as string | null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
})

/**
 * Creates a pending website knowledge crawl record (replaces any existing record for the user)
 */
export const createWebsiteKnowledgeCrawl = async (
  clerkUserId: string,
  url: string,
  crawlId: string
): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    // Upsert: update existing row (preserving vector_store_file_id) or insert new
    const existing = await client.execute({
      sql: 'SELECT id FROM website_knowledge WHERE clerk_user_id = ? LIMIT 1',
      args: [clerkUserId],
    })

    if (existing.rows.length > 0) {
      await client.execute({
        sql: `UPDATE website_knowledge
              SET url = ?, status = 'pending', crawl_id = ?, error_message = NULL,
                  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
              WHERE clerk_user_id = ?`,
        args: [url, crawlId, clerkUserId],
      })
    } else {
      await client.execute({
        sql: `INSERT INTO website_knowledge (id, clerk_user_id, url, status, crawl_id)
              VALUES (lower(hex(randomblob(16))), ?, ?, 'pending', ?)`,
        args: [clerkUserId, url, crawlId],
      })
    }
  } catch (error) {
    console.error('[turso] Failed to create website knowledge crawl', {
      clerkUserId,
      error: (error as Error).message,
    })
  }
}

/**
 * Retrieves the website knowledge record for a user
 */
export const getWebsiteKnowledge = async (
  clerkUserId: string
): Promise<WebsiteKnowledgeData | null> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return null

    const result = await client.execute({
      sql: `SELECT id, clerk_user_id, url, status, error_message, crawl_id, vector_store_file_id, last_crawled_at, created_at, updated_at
            FROM website_knowledge WHERE clerk_user_id = ? LIMIT 1`,
      args: [clerkUserId],
    })

    if (result.rows.length === 0) return null
    return mapRowToWebsiteKnowledge(result.rows[0] as Record<string, unknown>)
  } catch (error) {
    console.error('[turso] Failed to get website knowledge', {
      clerkUserId,
      error: (error as Error).message,
    })
    return null
  }
}

/**
 * Updates a website knowledge record with crawl results (success)
 */
export const completeWebsiteKnowledgeCrawl = async (
  clerkUserId: string,
  vectorStoreFileId: string
): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    await client.execute({
      sql: `UPDATE website_knowledge
            SET vector_store_file_id = ?, status = 'completed', error_message = NULL,
                last_crawled_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE clerk_user_id = ?`,
      args: [vectorStoreFileId, clerkUserId],
    })
  } catch (error) {
    console.error('[turso] Failed to complete website knowledge crawl', {
      clerkUserId,
      error: (error as Error).message,
    })
  }
}

/**
 * Marks a website knowledge crawl as failed
 */
export const failWebsiteKnowledgeCrawl = async (
  clerkUserId: string,
  errorMessage: string
): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    await client.execute({
      sql: `UPDATE website_knowledge
            SET status = 'failed', error_message = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE clerk_user_id = ?`,
      args: [errorMessage, clerkUserId],
    })
  } catch (error) {
    console.error('[turso] Failed to mark website knowledge crawl as failed', {
      clerkUserId,
      error: (error as Error).message,
    })
  }
}

/**
 * Clears the vector_store_file_id for a user's website knowledge record.
 * Called when the crawl file is manually deleted by the user.
 */
export const clearWebsiteKnowledgeFileId = async (
  fileId: string
): Promise<void> => {
  try {
    await ensureInitialized()
    const client = getClientOrNull()
    if (!client) return

    await client.execute({
      sql: `UPDATE website_knowledge
            SET vector_store_file_id = NULL,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE vector_store_file_id = ?`,
      args: [fileId],
    })
  } catch (error) {
    console.error('[turso] Failed to clear website knowledge file ID', {
      fileId,
      error: (error as Error).message,
    })
  }
}
