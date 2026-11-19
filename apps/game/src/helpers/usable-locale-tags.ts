const ACCEPT_LANGUAGE_WEIGHT = /;.*$/

const canonicalTagOrNone = (tag: string): string | null => {
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? null
  } catch {
    return null
  }
}

/**
 * The tags `Intl` will take, in the order given and once each.
 *
 * `navigator.languages` is not guaranteed BCP-47: a Chrome on macOS handed one
 * screen `en;q=0.9`, an `Accept-Language` weight left on the tag, and every
 * `Intl.NumberFormat` built over the list threw. The weight is dropped so the
 * language behind it still counts, and anything still invalid is skipped.
 */
export const usableLocaleTags = (tags: readonly string[]): string[] => [
  ...new Set(
    tags
      .map((tag) =>
        canonicalTagOrNone(tag.replace(ACCEPT_LANGUAGE_WEIGHT, '').trim())
      )
      .filter((tag) => tag !== null)
  )
]
