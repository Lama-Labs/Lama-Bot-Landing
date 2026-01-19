'use server'

import { auth } from '@clerk/nextjs/server'

import { getClerkUser } from '@/utils/clerk/users'
import { getUserData, upsertUser } from '@/utils/turso'

/**
 * Ensures the current authenticated user exists in the database.
 * This is a fallback in case the user.created webhook failed.
 * Call this on dashboard load to guarantee the user record exists.
 *
 * Returns true if user exists (or was created), false if not authenticated.
 */
export async function ensureUserInDatabase(): Promise<boolean> {
  const { userId } = await auth()

  if (!userId) {
    return false
  }

  // Check if user already exists in database
  const existingUser = await getUserData(userId)

  if (existingUser) {
    // User already exists, no action needed
    return true
  }

  // User doesn't exist in DB - create them (webhook might have failed)
  console.log(
    `[ensureUserInDatabase] User not found in DB, creating: ${userId}`
  )

  const clerkUser = await getClerkUser(userId)

  if (!clerkUser) {
    console.error(`[ensureUserInDatabase] Clerk user not found: ${userId}`)
    return false
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null

  await upsertUser({
    clerkUserId: userId,
    email,
  })

  console.log(`[ensureUserInDatabase] User created successfully: ${userId}`)
  return true
}
