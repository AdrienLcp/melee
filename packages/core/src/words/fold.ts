const COMBINING_MARKS = /\p{M}/gu

const LIGATURES: Readonly<Record<string, string>> = { Æ: 'AE', Œ: 'OE' }

const LIGATURE = /[ÆŒ]/gu

const WHOLE_WORD = /^[A-Z]+$/

/**
 * A form as both word games spell it: `A`–`Z` only, accents dropped, `Œ` and
 * `Æ` written as their two letters. `null` for anything that is not one word
 * once folded — a hyphen, an apostrophe, a space or a digit — because a
 * compound is not a word here.
 */
export const foldWord = (text: string): string | null => {
  const folded = text
    .toUpperCase()
    .replace(LIGATURE, (ligature) => LIGATURES[ligature] ?? ligature)
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')

  return WHOLE_WORD.test(folded) ? folded : null
}
