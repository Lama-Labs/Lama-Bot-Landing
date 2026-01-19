import { getUserData } from '../turso'

type HasFunction = (query: { plan: string }) => boolean

/**
 * Returns true if the user has ANY of the provided plans, using Clerk's `has` API from `auth()`.
 * Pass the `has` function from `auth()` to avoid multiple auth lookups in a single request.
 *
 * If a clerkUserId is provided, also checks the `trial` field in the database
 * which can override the plan check (e.g., trial="basic" grants basic tier access).
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
