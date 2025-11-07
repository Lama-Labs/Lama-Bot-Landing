import { clerkClient } from '@clerk/nextjs/server'

import { upsertUser } from '../turso'

export async function getClerkUser(userId: string) {
  const client = await clerkClient()
  try {
    return await client.users.getUser(userId)
  } catch (_error) {
    // Surface null on not-found or API errors so callers can handle gracefully
    return null
  }
}

export async function mergeUserPublicMetadata(
  userId: string,
  partial: Record<string, unknown>
): Promise<boolean> {
  const client = await clerkClient()
  const user = await getClerkUser(userId)
  if (!user) return false

  // Update Clerk
  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      ...partial,
    },
  })

  // Also save to Turso DB (non-blocking)
  try {
    const email = user.emailAddresses[0]?.emailAddress ?? null
    await upsertUser({
      clerkUserId: userId,
      email,
      apiKey: partial.apiKey as string | undefined,
      documentCount: partial.documentCount as number | undefined,
      totalStorageLimit: partial.totalStorageLimit as number | undefined,
    })
  } catch (error) {
    console.error('[clerk/users] Failed to sync public metadata to Turso', {
      userId,
      error: (error as Error).message,
    })
    // Don't fail the operation if Turso sync fails
  }

  return true
}

export async function mergeUserPrivateMetadata(
  userId: string,
  partial: Record<string, unknown>
): Promise<boolean> {
  const client = await clerkClient()
  const user = await getClerkUser(userId)
  if (!user) return false

  // Update Clerk
  await client.users.updateUser(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      ...partial,
    },
  })

  // Also save to Turso DB (non-blocking)
  try {
    const email = user.emailAddresses[0]?.emailAddress ?? null
    await upsertUser({
      clerkUserId: userId,
      email,
      vectorStoreId: partial.vectorStoreId as string | undefined,
    })
  } catch (error) {
    console.error('[clerk/users] Failed to sync private metadata to Turso', {
      userId,
      error: (error as Error).message,
    })
    // Don't fail the operation if Turso sync fails
  }

  return true
}
