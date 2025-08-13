import { clerkClient } from '@clerk/nextjs/server'

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
  await client.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      ...partial,
    },
  })
  return true
}

export async function mergeUserPrivateMetadata(
  userId: string,
  partial: Record<string, unknown>
): Promise<boolean> {
  const client = await clerkClient()
  const user = await getClerkUser(userId)
  if (!user) return false
  await client.users.updateUser(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      ...partial,
    },
  })
  return true
}
