import { type ContentTier, contentTiers } from '../round/difficulty-draw'

/**
 * What a bank says of one form beyond its spelling: the tier of a word a
 * mystery word may hide, or `familiar` for a long form a table would know on
 * the reveal.
 */
export type WordMark = ContentTier | 'familiar'

export type CodedWord = { mark: WordMark | null; word: string }

const LETTER_OF_MARK = {
  easy: 'e',
  familiar: 'f',
  hard: 'h',
  medium: 'm'
} as const satisfies Record<WordMark, string>

const MARK_OF_LETTER: Readonly<Record<string, WordMark>> = Object.fromEntries(
  ([...contentTiers, 'familiar'] as const).map((mark) => [
    LETTER_OF_MARK[mark],
    mark
  ])
)

/** The digit that says how many letters an entry shares with the one before. */
const ZERO = '0'.charCodeAt(0)
const CAPITAL_A = 'A'.charCodeAt(0)
const CAPITAL_Z = 'Z'.charCodeAt(0)

/** Words of ten letters or more would need a second digit, and no game here plays one. */
export const LONGEST_CODED_WORD = 10

/**
 * The whole coded list matches this: entries of a digit, capitals and an
 * optional mark letter, one after the other with no separator.
 */
export const CODED_WORD_LIST = /^(?:\d[A-Z]+[efhm]?)*$/

const sharedLength = ({
  previous,
  word
}: {
  previous: string
  word: string
}): number => {
  let shared = 0

  while (shared < previous.length && previous[shared] === word[shared]) {
    shared++
  }

  return shared
}

/**
 * Folded words as one string, front-coded: in code-unit order, each entry is
 * the count of letters it shares with the entry before, the letters it adds,
 * and its mark's letter. A sorted list repeats its prefixes on every line,
 * and spelling each once halves what the bank weighs once compressed.
 */
export const encodeWordList = (words: readonly CodedWord[]): string => {
  let previous = ''

  return words
    .toSorted((left, right) =>
      left.word < right.word ? -1 : left.word > right.word ? 1 : 0
    )
    .map(({ mark, word }) => {
      if (word.length >= LONGEST_CODED_WORD) {
        throw new Error(`${word} is too long to code`)
      }

      const shared = sharedLength({ previous, word })

      previous = word

      return `${shared}${word.slice(shared)}${mark === null ? '' : LETTER_OF_MARK[mark]}`
    })
    .join('')
}

const isCapital = (code: number): boolean =>
  code >= CAPITAL_A && code <= CAPITAL_Z

/** Every entry of a list `encodeWordList` wrote, in its code-unit order. */
export const decodeWordList = (coded: string): CodedWord[] => {
  const words: CodedWord[] = []
  let previous = ''
  let index = 0

  while (index < coded.length) {
    const shared = coded.charCodeAt(index) - ZERO
    let end = index + 1

    while (end < coded.length && isCapital(coded.charCodeAt(end))) {
      end++
    }

    const word = previous.slice(0, shared) + coded.slice(index + 1, end)
    const mark = MARK_OF_LETTER[coded.charAt(end)] ?? null

    words.push({ mark, word })
    previous = word
    index = mark === null ? end : end + 1
  }

  return words
}
