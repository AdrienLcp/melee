const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export type RebusWord = {
  emojis: string[]
  /** The word and how many times it came before, since a rebus may repeat one. */
  key: string
}

/**
 * A rebus split where its author put a space, each word into the emojis a
 * screen draws one by one. A word stays whole on its line, so `🧊🚢 💔` never
 * breaks between the ice and the ship.
 */
export const rebusWordsOf = (rebus: string): RebusWord[] => {
  const seen = new Map<string, number>()

  return rebus
    .split(' ')
    .filter((word) => word !== '')
    .map((word) => {
      const before = seen.get(word) ?? 0

      seen.set(word, before + 1)

      return {
        emojis: [...graphemes.segment(word)].map(({ segment }) => segment),
        key: `${word}#${before}`
      }
    })
}
