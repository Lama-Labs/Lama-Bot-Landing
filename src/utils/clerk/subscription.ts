type HasFunction = (query: { plan: string }) => boolean
type PublicMetadata = Record<string, unknown>

/**
 * Returns true if the user has ANY of the provided plans, using Clerk's `has` API from `auth()`.
 * Pass the `has` function from `auth()` to avoid multiple auth lookups in a single request.
 */
export function hasAnyPlan(
  has: HasFunction | undefined,
  plans: string | string[],
  publicMetadata?: PublicMetadata
): boolean {
  // Return false if has function is not available (user not loaded yet)
  if (!has) return false

  const planList = Array.isArray(plans) ? plans : [plans]

  // Allow access if the user is on a matching trial tier in public metadata
  const trialValue = publicMetadata?.trial
  if (typeof trialValue === 'string' && planList.includes(trialValue)) {
    return true
  }

  // Check if user has any of the specified plans using Clerk's billing API
  for (const plan of planList) {
    if (has({ plan })) return true
  }
  return false
}
