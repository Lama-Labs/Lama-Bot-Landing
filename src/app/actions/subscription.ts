'use server'

import { auth } from '@clerk/nextjs/server'

import { hasAnyPlan } from '@/utils/clerk/subscription'

/**
 * Server action to check if the current authenticated user has an active subscription.
 * Use this in client components that need to check subscription status.
 */
export async function getSubscriptionStatus(): Promise<boolean> {
  const { userId, has } = await auth()
  if (!userId) return false
  return hasAnyPlan(has, 'basic', userId)
}
