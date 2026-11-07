const DIACRITICS = /\p{Diacritic}/gu

const LEADING_ARTICLE = /^(?:the|an?|le|la|les|une?|des|du)\s+|^l['’]\s*/u

/** What a subtitle hangs from: *Avatar : la voie de l'eau*, *Shrek 4 – Il était une fin*. */
const SUBTITLE = /\s*(?::|\s[–—-]\s|\().*$/u

const NOT_A_WORD_CHARACTER = /[^\p{L}\p{N}']/gu

const SEQUEL_MARK =
  /^(?:\d+|\d+(?:e|er|eme|nd|rd|st|th)|[ivx]+|part|partie|volume|vol|chapter|chapitre|returns|rises)$/u

const NUMBERED_TAILS: readonly (readonly [string, string])[] = [
  ['the', 'third'],
  ['le', 'troisieme']
]

/**
 * Below this, a title inside another is a common word rather than a franchise:
 * *Une femme* is inside Annie Ernaux's *La Femme gelée*, *Coco* inside *Coco
 * avant Chanel*.
 */
const LEAST_CONTAINED_LETTERS = 8

/** How many leading words name a franchise: *Retour vers* le futur, *Toy Story*. */
const FRANCHISE_WORDS = 2

const withoutSequelTail = (words: readonly string[]): readonly string[] => {
  const last = words.at(-1)

  if (words.length > 1 && last !== undefined && SEQUEL_MARK.test(last)) {
    return withoutSequelTail(words.slice(0, -1))
  }

  const isNumberedTail = NUMBERED_TAILS.some(
    ([first, second]) => words.at(-2) === first && last === second
  )

  return isNumberedTail && words.length > 2
    ? withoutSequelTail(words.slice(0, -2))
    : words
}

const wordsOf = (label: string): readonly string[] =>
  label
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(LEADING_ARTICLE, '')
    .split(/\s+/u)
    .map((word) => word.replace(NOT_A_WORD_CHARACTER, ''))
    .filter((word) => word.length > 0)

const titleWordsOf = (label: string): readonly string[] =>
  withoutSequelTail(wordsOf(label.replace(SUBTITLE, '')))

/**
 * The words a title shares with its sequels: *Shrek*, *Shrek 2* and *Shrek le
 * troisième* all stem to `shrek`, *The Godfather Part II* to `godfather`.
 *
 * It reads the shape of a label, so it misses a sequel named on its own —
 * *Jurassic Park* and *The Lost World* — and a theme whose answers are not
 * works trips it for nothing: *Corée du Nord* and *Corée du Sud* share two
 * words. Only works are read through it.
 */
export const franchiseStemOf = (label: string): string =>
  titleWordsOf(label).slice(0, FRANCHISE_WORDS).join(' ')

/** Whether a title is its franchise's own name, with no number and no subtitle: *Shrek*, not *Shrek 2*. */
export const isFranchiseBase = (label: string): boolean =>
  titleWordsOf(label).join(' ') === wordsOf(label).join(' ')

/**
 * Whether one whole title runs inside a longer one, as a sequel carries the
 * film it follows: *Trainspotting* in *T2 Trainspotting*, which no stem joins.
 */
export const isTitleWithin = ({
  title,
  within
}: {
  title: string
  within: string
}): boolean => {
  const inner = wordsOf(title)
  const outer = wordsOf(within)

  if (
    inner.join('').length < LEAST_CONTAINED_LETTERS ||
    inner.length >= outer.length
  ) {
    return false
  }

  return outer.some((_, start) =>
    inner.every((word, offset) => outer[start + offset] === word)
  )
}
