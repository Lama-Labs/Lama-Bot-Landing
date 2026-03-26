'use server'

import { auth } from '@clerk/nextjs/server'
import Firecrawl from '@mendable/firecrawl-js'

import { hasAnyPlan } from '@/utils/clerk/subscription'
import {
  type WebsiteKnowledgeData,
  completeWebsiteKnowledgeCrawl,
  createWebsiteKnowledgeCrawl,
  failWebsiteKnowledgeCrawl,
  getWebsiteKnowledge,
  getUserData,
} from '@/utils/turso'
import { uploadCrawlToR2 } from '@/utils/r2-helpers'
import {
  deleteFileFromVectorStore,
  uploadFileToVectorStore,
} from '@/utils/vector-store-helpers'

const CRAWL_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

function buildCrawlFileName(url: string): string {
  let hostname: string
  try {
    hostname = new URL(url).hostname.replace(/\./g, '-')
  } catch {
    hostname = 'website'
  }
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `crawl-${hostname}-${date}.md`
}

function normalizeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`
  }
  return url
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function getFirecrawlClient(): Firecrawl {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is not configured')
  }
  return new Firecrawl({ apiKey })
}

export type CrawlStatusResponse = {
  status: 'idle' | 'pending' | 'completed' | 'failed'
  url?: string
  errorMessage?: string
  lastCrawledAt?: string | null
  crawlEnabled: boolean
  crawlMaxPages: number
  canCrawl: boolean
  cooldownEndsAt?: string | null
}

/**
 * Gets the current crawl status for the authenticated user.
 * When status is 'pending', polls Firecrawl and processes the result.
 */
export async function getWebsiteKnowledgeStatusAction(): Promise<CrawlStatusResponse> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized: User must be signed in')

  const userData = await getUserData(userId)
  if (!userData) {
    return { status: 'idle', crawlEnabled: false, crawlMaxPages: 0, canCrawl: false }
  }

  const crawlEnabled = !!userData.crawlEnabled
  const crawlMaxPages = userData.crawlMaxPages ?? 0
  const cooldownDays = userData.crawlCooldownDays ?? 30

  const record = await getWebsiteKnowledge(userId)

  const cooldownEndsAt = computeCooldownEnd(record, cooldownDays)
  const canCrawl = crawlEnabled && !cooldownEndsAt

  if (!record) {
    return { status: 'idle', crawlEnabled, crawlMaxPages, canCrawl }
  }

  // If pending, check for timeout first, then poll Firecrawl
  if (record.status === 'pending') {
    const updatedAt = new Date(record.updatedAt).getTime()
    if (Date.now() - updatedAt > CRAWL_TIMEOUT_MS) {
      await failWebsiteKnowledgeCrawl(userId, 'Crawl timed out')
      return {
        status: 'failed',
        errorMessage: 'Crawl timed out',
        url: record.url,
        lastCrawledAt: record.lastCrawledAt,
        crawlEnabled,
        crawlMaxPages,
        canCrawl: crawlEnabled,
      }
    }

    // Poll Firecrawl for status
    if (record.crawlId) {
      try {
        const firecrawl = getFirecrawlClient()
        const crawlStatus = await firecrawl.getCrawlStatus(record.crawlId)

        if (crawlStatus.status === 'completed') {
          const markdownPages = (crawlStatus.data ?? [])
            .map((page: { markdown?: string }) => page.markdown ?? '')
            .filter((md: string) => md.length > 0)

          if (markdownPages.length === 0) {
            await failWebsiteKnowledgeCrawl(userId, 'No content found on the website')
            return {
              status: 'failed',
              errorMessage: 'No content found on the website',
              url: record.url,
              lastCrawledAt: record.lastCrawledAt,
              crawlEnabled,
              crawlMaxPages,
              canCrawl: crawlEnabled,
            }
          }

          const combinedContent = markdownPages.join('\n\n---\n\n')

          // Delete old crawl file from vector store if one exists
          if (record.vectorStoreFileId) {
            try {
              await deleteFileFromVectorStore(userId, record.vectorStoreFileId)
            } catch (e) {
              console.error('[website-knowledge] Failed to delete old crawl file', {
                error: (e as Error).message,
              })
            }
          }

          // Upload new crawl content to vector store
          const fileName = buildCrawlFileName(record.url)
          const file = new File([combinedContent], fileName, {
            type: 'text/markdown',
          })
          const fileId = await uploadFileToVectorStore(userId, file, fileName)

          if (!fileId) {
            await failWebsiteKnowledgeCrawl(userId, 'Failed to upload crawl to vector store')
            return {
              status: 'failed',
              errorMessage: 'Failed to upload crawl to vector store',
              url: record.url,
              lastCrawledAt: record.lastCrawledAt,
              crawlEnabled,
              crawlMaxPages,
              canCrawl: crawlEnabled,
            }
          }

          // Backup raw content to R2 (fire-and-forget, non-blocking)
          uploadCrawlToR2(userId, fileName, combinedContent).catch((e) => {
            console.error('[website-knowledge] Failed to upload crawl backup to R2', {
              error: (e as Error).message,
            })
          })

          // Save vector store file ID
          await completeWebsiteKnowledgeCrawl(userId, fileId)

          return {
            status: 'completed',
            url: record.url,
            lastCrawledAt: new Date().toISOString(),
            crawlEnabled,
            crawlMaxPages,
            canCrawl: false,
            cooldownEndsAt: computeCooldownEnd(
              { lastCrawledAt: new Date().toISOString() },
              cooldownDays
            ),
          }
        }

        if (crawlStatus.status === 'failed' || crawlStatus.status === 'cancelled') {
          const message = crawlStatus.status === 'cancelled' ? 'Crawl was cancelled' : 'Crawl failed'
          await failWebsiteKnowledgeCrawl(userId, message)
          return {
            status: 'failed',
            errorMessage: message,
            url: record.url,
            lastCrawledAt: record.lastCrawledAt,
            crawlEnabled,
            crawlMaxPages,
            canCrawl: crawlEnabled,
          }
        }

        // Still crawling
        return {
          status: 'pending',
          url: record.url,
          crawlEnabled,
          crawlMaxPages,
          canCrawl: false,
        }
      } catch (error) {
        console.error('[website-knowledge] Failed to check Firecrawl status', {
          error: (error as Error).message,
        })
        return {
          status: 'pending',
          url: record.url,
          crawlEnabled,
          crawlMaxPages,
          canCrawl: false,
        }
      }
    }
  }

  return {
    status: record.status,
    url: record.url,
    errorMessage: record.errorMessage ?? undefined,
    lastCrawledAt: record.lastCrawledAt,
    crawlEnabled,
    crawlMaxPages,
    canCrawl: record.status === 'pending' ? false : (crawlEnabled && !cooldownEndsAt),
    cooldownEndsAt,
  }
}

/**
 * Triggers a website crawl via the Firecrawl SDK
 */
export async function triggerCrawlAction(
  url: string
): Promise<{ success: boolean; error?: string }> {
  const { userId, has } = await auth()
  if (!userId) throw new Error('Unauthorized: User must be signed in')

  const isEligible = await hasAnyPlan(has, 'basic', userId)
  if (!isEligible) {
    return { success: false, error: 'Requires an active paid plan' }
  }

  const userData = await getUserData(userId)
  if (!userData?.crawlEnabled) {
    return { success: false, error: 'Crawling is not available for your plan' }
  }

  const normalizedUrl = normalizeUrl(url)
  if (!isValidUrl(normalizedUrl)) {
    return { success: false, error: 'Please enter a valid URL' }
  }

  const existingRecord = await getWebsiteKnowledge(userId)

  if (existingRecord?.status === 'pending') {
    return { success: false, error: 'A crawl is already in progress' }
  }

  const cooldownEndsAt = computeCooldownEnd(
    existingRecord,
    userData.crawlCooldownDays ?? 30
  )
  if (cooldownEndsAt) {
    return { success: false, error: `Crawl cooldown active until ${cooldownEndsAt}` }
  }

  try {
    const firecrawl = getFirecrawlClient()

    const crawlResult = await firecrawl.startCrawl(normalizedUrl, {
      limit: userData.crawlMaxPages ?? 20,
      scrapeOptions: {
        onlyMainContent: true,
        formats: ['markdown'],
      },
    })

    if (!crawlResult.id) {
      return { success: false, error: 'Failed to start crawl. Please try again later.' }
    }

    await createWebsiteKnowledgeCrawl(userId, normalizedUrl, crawlResult.id)

    return { success: true }
  } catch (error) {
    console.error('[website-knowledge] Failed to start Firecrawl crawl', {
      error: (error as Error).message,
    })
    return { success: false, error: 'Crawl service is unavailable. Please try again later.' }
  }
}

function computeCooldownEnd(
  record: Pick<WebsiteKnowledgeData, 'lastCrawledAt'> | null,
  cooldownDays: number
): string | null {
  if (!record?.lastCrawledAt) return null

  const lastCrawled = new Date(record.lastCrawledAt)
  const cooldownEnd = new Date(
    lastCrawled.getTime() + cooldownDays * 24 * 60 * 60 * 1000
  )

  if (Date.now() < cooldownEnd.getTime()) {
    return cooldownEnd.toISOString()
  }

  return null
}
