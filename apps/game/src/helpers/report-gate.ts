/** How many reports one page load sends at most: a render loop must not become a flood. */
export const MOST_REPORTS_PER_PAGE = 10

/**
 * Says whether a report goes out: once per distinct fault, and never past
 * `limit` in a page load. The same error caught by a boundary and seen again by
 * React's root hook is one fault, so the kind is not part of what is compared.
 */
export const createReportGate = (limit: number = MOST_REPORTS_PER_PAGE) => {
  const seen = new Set<string>()

  return (fault: { message: string; name: string; where: string }): boolean => {
    const key = `${fault.name}\u0000${fault.message}\u0000${fault.where}`

    if (seen.has(key) || seen.size >= limit) {
      return false
    }

    seen.add(key)

    return true
  }
}
