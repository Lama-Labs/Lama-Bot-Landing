'use server'

import { auth } from '@clerk/nextjs/server'
import { unstable_cache, updateTag } from 'next/cache'

import { hasAnyPlan } from '@/utils/clerk/subscription'
import { ANY_PAID_PLAN } from '@/utils/plans'
import { getCustomInstructions, saveCustomInstructions } from '@/utils/turso'

const tagForUser = (userId: string) => `custom-instructions:${userId}`

async function getCustomInstructionsCached(
  userId: string
): Promise<string | null> {
  const tag = tagForUser(userId)

  const cached = unstable_cache(
    async (id: string) => {
      return await getCustomInstructions(id)
    },
    ['getCustomInstructions', userId],
    { tags: [tag] }
  )

  return cached(userId)
}

/**
 * Fetches custom instructions for the authenticated user.
 *
 * Returned verbatim: these are consumed by a React text field (which escapes on
 * render) and spliced into the assistant's system prompt, where HTML entities
 * would corrupt the owner's wording.
 */
export async function getCustomInstructionsAction(): Promise<string> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized: User must be signed in')
  }

  return (await getCustomInstructionsCached(userId)) ?? ''
}

/**
 * Saves custom instructions for the authenticated user
 */
export async function saveCustomInstructionsAction(
  instructions: string
): Promise<{ success: boolean; message: string }> {
  const { userId, has } = await auth()

  if (!userId) {
    throw new Error('Unauthorized: User must be signed in')
  }

  // Ensure user has an eligible paid plan or matching trial tier (e.g., basic)
  const isEligible = await hasAnyPlan(has, ANY_PAID_PLAN, userId)
  if (!isEligible) {
    throw new Error('Requires an active paid plan')
  }

  // Trim only leading/trailing whitespace (preserves internal newlines and formatting)
  const trimmedInstructions = instructions.trim()

  // Enforce 5000 character limit
  if (trimmedInstructions.length > 5000) {
    throw new Error('Instructions cannot exceed 5000 characters')
  }

  // Stored verbatim: SQL injection is prevented by Turso's parameterized queries,
  // and every consumer either escapes on render or needs the owner's exact wording.
  await saveCustomInstructions(userId, trimmedInstructions)
  // Invalidate cache so subsequent reads get fresh value
  updateTag(tagForUser(userId))

  return {
    success: true,
    message: 'Instructions saved successfully',
  }
}
