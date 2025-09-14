type HasFunction = (query: { plan: string }) => boolean
type PublicMetadata = Record<string, unknown>

/**
 * Returns true if the user has ANY of the provided plans, using Clerk's `has` API from `auth()`.
 * Pass the `has` function from `auth()` to avoid multiple auth lookups in a single request.
 */
export function hasAnyPlan(
  has: HasFunction,
  plans: string | string[],
  publicMetadata?: PublicMetadata
): boolean {
  const planList = Array.isArray(plans) ? plans : [plans]

  // Allow access if user is on a matching trial tier in public metadata
  const trialValue = publicMetadata?.trial
  if (typeof trialValue === 'string' && planList.includes(trialValue)) {
    return true
  }

  // Otherwise, require an active paid plan
  for (const plan of planList) {
    if (has({ plan })) return true
  }
  return false
}
