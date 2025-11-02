'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidateTag, unstable_cache } from 'next/cache'

import { getCustomInstructions, saveCustomInstructions } from '@/utils/turso'

const tagForUser = (userId: string) => `custom-instructions:${userId}`

// Raw cached getter for internal use (no HTML escaping)
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
 * Escapes HTML entities to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Fetches custom instructions for the authenticated user
 */
export async function getCustomInstructionsAction(): Promise<string> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized: User must be signed in')
  }

  const instructions = await getCustomInstructionsCached(userId)

  // Escape HTML entities when returning to prevent XSS
  if (instructions) {
    return escapeHtml(instructions)
  }

  return ''
}

/**
 * Saves custom instructions for the authenticated user
 */
export async function saveCustomInstructionsAction(
  instructions: string
): Promise<{ success: boolean; message: string }> {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized: User must be signed in')
  }

  // Trim only leading/trailing whitespace (preserves internal newlines and formatting)
  const trimmedInstructions = instructions.trim()

  // Enforce 5000 character limit
  if (trimmedInstructions.length > 5000) {
    throw new Error('Instructions cannot exceed 5000 characters')
  }

  // Escape HTML entities to prevent HTML injection
  const sanitizedInstructions = escapeHtml(trimmedInstructions)

  // Save to database (injection already prevented by Turso's parameterized queries)
  await saveCustomInstructions(userId, sanitizedInstructions)
  // Invalidate cache so subsequent reads get fresh value
  revalidateTag(tagForUser(userId))

  return {
    success: true,
    message: 'Instructions saved successfully',
  }
}
