/** One character of the condensed display face, read off the wall at 0.57 and taken a little wide. */
const CHARACTER_EM = 0.6
const WORD_GAP_EM = 0.28

const wordsFitting = ({
  roomEm,
  wordLengths
}: {
  roomEm: number
  wordLengths: readonly number[]
}): number => {
  let used = -WORD_GAP_EM
  let count = 0

  for (const length of wordLengths) {
    used += WORD_GAP_EM + length * CHARACTER_EM

    if (used > roomEm) {
      break
    }

    count += 1
  }

  return count
}

/** A name's whole words, which a row drops from the end rather than cut one. */
export const wordsOf = (name: string): string[] =>
  name.split(/\s+/u).filter((word) => word.length > 0)

/** A name's initials, two at most, for a row too narrow for its first word. */
export const initialsOf = (name: string): string =>
  name
    .split(/[\s-]+/u)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => [...word][0]?.toLocaleUpperCase() ?? '')
    .join('')

/**
 * As much of a name as `roomEm` holds, in its own font size: its first whole
 * words, or its initials when not even the first fits.
 */
export const nameWithin = ({
  name,
  roomEm
}: {
  name: string
  roomEm: number
}): string => {
  const words = wordsOf(name)
  const kept = wordsFitting({
    roomEm,
    wordLengths: words.map((word) => [...word].length)
  })

  return kept === 0 ? initialsOf(name) : words.slice(0, kept).join(' ')
}
