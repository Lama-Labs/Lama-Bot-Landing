'use server'

import { auth } from '@clerk/nextjs/server'

import { ANY_PAID_PLAN, PLUS_ONLY_PLAN } from '@/utils/plans'
import { getUserData } from '@/utils/turso'

export type SubscriptionStatus = {
  hasSubscription: boolean
  hasPlusPlan: boolean
}

/**
 * Server action to check if the current authenticated user has an active subscription.
 * Returns both general subscription status and plus-tier status.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { userId, has } = await auth()
  if (!userId || !has) return { hasSubscription: false, hasPlusPlan: false }

  // Single DB read for trial override
  const userData = await getUserData(userId)
  const trial = userData?.trial ?? null

  const hasPlan = (plans: string[]) => {
    if (trial && plans.includes(trial)) return true
    return plans.some((plan) => has({ plan }))
  }

  return {
    hasSubscription: hasPlan(ANY_PAID_PLAN),
    hasPlusPlan: hasPlan(PLUS_ONLY_PLAN),
  }
}
