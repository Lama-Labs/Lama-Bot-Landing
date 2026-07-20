import { clerkClient } from '@clerk/nextjs/server'

import { getUserData } from '../turso'

type HasFunction = (query: { plan: string }) => boolean

export type ActivePlanPeriod = {
  planSlug: string
  planPeriod: 'month' | 'annual'
  periodStart: string
  periodEnd: string
  source: 'clerk'
}

const getActiveSubscriptionItemByUserId = async (
  clerkUserId: string,
  plans: string | string[]
) => {
  const planList = Array.isArray(plans) ? plans : [plans]

  try {
    const client = await clerkClient()
    const subscription =
      await client.billing.getUserBillingSubscription(clerkUserId)

    if (subscription.status !== 'active') return null

    return (
      subscription.subscriptionItems.find(
        (item) =>
          item.status === 'active' &&
          item.periodEnd != null &&
          item.plan != null &&
          planList.includes(item.plan.slug)
      ) ?? null
    )
  } catch (error) {
    console.error(
      '[subscription] Failed to check subscription via backend API',
      { clerkUserId, error: (error as Error).message }
    )
    return null
  }
}

/**
 * Returns true if the user has ANY of the provided plans, using Clerk's `has` API from `auth()`.
 * Pass the `has` function from `auth()` to avoid multiple auth lookups in a single request.
 *
 * If a clerkUserId is provided, also checks the `trial` field in the database
 * which can override the plan check (e.g., trial="basic" grants basic tier access).
 *
 * Use this when a Clerk session is available (server actions, browser API routes).
 * For API-key-based auth without a session, use `hasAnyPlanByUserId` instead.
 */
export async function hasAnyPlan(
  has: HasFunction | undefined,
  plans: string | string[],
  clerkUserId?: string | null
): Promise<boolean> {
  // Return false if has function is not available (user not loaded yet)
  if (!has) return false

  const planList = Array.isArray(plans) ? plans : [plans]

  // Check trial override from database
  if (clerkUserId) {
    const userData = await getUserData(clerkUserId)
    if (userData?.trial && planList.includes(userData.trial)) {
      return true
    }
  }

  // Check if user has any of the specified plans using Clerk's billing API
  for (const plan of planList) {
    if (has({ plan })) return true
  }
  return false
}

/**
 * Checks subscription via Clerk's backend API using only the clerkUserId.
 * Use this when there is no Clerk session (e.g., API-key-based auth in /api/chat).
 * Also checks the `trial` field in the database as a fallback.
 */
export async function hasAnyPlanByUserId(
  clerkUserId: string,
  plans: string | string[]
): Promise<boolean> {
  const planList = Array.isArray(plans) ? plans : [plans]

  // Check trial override from database first (fast, avoids external API call)
  const userData = await getUserData(clerkUserId)
  if (userData?.trial && planList.includes(userData.trial)) {
    return true
  }

  return (await getActiveSubscriptionItemByUserId(clerkUserId, plans)) !== null
}

/**
 * Returns the active billing period metadata used by token quota creation when
 * Turso needs to open a new TokenUsage row.
 */
export async function getActivePlanPeriodByUserId(
  clerkUserId: string,
  plans: string | string[]
): Promise<ActivePlanPeriod | null> {
  const activeItem = await getActiveSubscriptionItemByUserId(clerkUserId, plans)
  if (!activeItem || activeItem.periodEnd == null || !activeItem.plan) {
    return null
  }

  return {
    planSlug: activeItem.plan.slug,
    planPeriod: activeItem.planPeriod,
    periodStart: new Date(activeItem.periodStart).toISOString(),
    periodEnd: new Date(activeItem.periodEnd).toISOString(),
    source: 'clerk',
  }
}
