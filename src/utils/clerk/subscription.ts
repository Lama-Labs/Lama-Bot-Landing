type HasFunction = (query: { plan: string }) => boolean

/**
 * Returns true if the user has ANY of the provided plans, using Clerk's `has` API from `auth()`.
 * Pass the `has` function from `auth()` to avoid multiple auth lookups in a single request.
 */
export function hasAnyPlan(
    has: HasFunction,
    plans: string | string[]
): boolean {
    const planList = Array.isArray(plans) ? plans : [plans]
    for (const plan of planList) {
        if (has({ plan })) return true
    }
    return false
}

