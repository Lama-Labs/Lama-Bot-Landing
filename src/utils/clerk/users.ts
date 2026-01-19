import { clerkClient } from '@clerk/nextjs/server'

/**
 * Get a Clerk user by ID (for accessing Clerk-managed fields like email)
 */
export async function getClerkUser(userId: string) {
  const client = await clerkClient()
  try {
    return await client.users.getUser(userId)
  } catch (_error) {
    // Surface null on not-found or API errors so callers can handle gracefully
    return null
  }
}
