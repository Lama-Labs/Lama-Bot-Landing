export const PLANS = {
  BASIC: 'basic',
  PLUS: 'plus',
} as const

export type PlanSlug = (typeof PLANS)[keyof typeof PLANS]

/** Plans that grant base subscription features (chat, crawl, custom instructions, API key) */
export const ANY_PAID_PLAN: PlanSlug[] = [PLANS.BASIC, PLANS.PLUS]

/** Plans that grant document upload (ManageFiles) */
export const PLUS_ONLY_PLAN: PlanSlug[] = [PLANS.PLUS]

export type PlanLimits = {
  documentCount: number
  totalStorageLimit: number
  crawlEnabled: number
  crawlMaxPages: number
  crawlCooldownDays: number
  monthlyTokenLimit: number
}

const MB = 1024 * 1024

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  basic: {
    documentCount: 10,
    totalStorageLimit: 10 * MB,
    crawlEnabled: 1,
    crawlMaxPages: 20,
    crawlCooldownDays: 30,
    monthlyTokenLimit: 100_000,
  },
  plus: {
    documentCount: 20,
    totalStorageLimit: 20 * MB,
    crawlEnabled: 1,
    crawlMaxPages: 50,
    crawlCooldownDays: 7,
    monthlyTokenLimit: 300_000,
  },
}

export function getPlanLimits(slug: string): PlanLimits {
  return PLAN_LIMITS[slug as PlanSlug] ?? PLAN_LIMITS.basic
}
