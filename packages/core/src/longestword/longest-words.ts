import { LONGEST_WORD_MIN_LENGTH } from '@melee/protocol/longest-word'

const CAPITAL_A = 'A'.charCodeAt(0)
const ALPHABET_LENGTH = 26

/** How many of the draw's longest words the reveal names. */
export const SHOWN_BEST_WORD_COUNT = 3

type LengthBucket = {
  forms: readonly string[]
  /** Each form's letters, a bit each, parallel to `forms`: a form using a letter the draw lacks is passed over on one AND. */
  masks: Int32Array
}

/** A language's forms, filed by length with each one's letters as a bit mask, built once and read on every draw. */
export type FormIndex = ReadonlyMap<number, LengthBucket>

export type LongestWords = {
  length: number
  /** Every form of that length the draw spells, in the dictionary's order. */
  words: string[]
}

const letterBit = (code: number): number => 1 << (code - CAPITAL_A)

const maskOf = (word: string): number => {
  let mask = 0

  for (let index = 0; index < word.length; index++) {
    mask |= letterBit(word.charCodeAt(index))
  }

  return mask
}

/** Files every form by length beside its letter mask, so a draw is solved without reading a form twice. */
export const indexForms = (
  formsByLength: ReadonlyMap<number, readonly string[]>
): FormIndex =>
  new Map(
    [...formsByLength].map(([length, forms]) => [
      length,
      { forms, masks: Int32Array.from(forms, maskOf) }
    ])
  )

const countsOf = (letters: readonly string[]): Int8Array => {
  const counts = new Int8Array(ALPHABET_LENGTH)

  for (const letter of letters) {
    const at = letter.charCodeAt(0) - CAPITAL_A

    counts[at] = (counts[at] ?? 0) + 1
  }

  return counts
}

const isSpelledWith = ({
  counts,
  left,
  word
}: {
  counts: Int8Array
  /** Scratch space, overwritten on every call. */
  left: Int8Array
  word: string
}): boolean => {
  left.set(counts)

  for (let index = 0; index < word.length; index++) {
    const at = word.charCodeAt(index) - CAPITAL_A
    const held = (left[at] ?? 0) - 1

    if (held < 0) {
      return false
    }

    left[at] = held
  }

  return true
}

/** Whether a folded word uses each of the drawn letters at most once. */
export const isSpelledFrom = ({
  letters,
  word
}: {
  letters: readonly string[]
  word: string
}): boolean =>
  isSpelledWith({
    counts: countsOf(letters),
    left: new Int8Array(ALPHABET_LENGTH),
    word
  })

/**
 * The longest forms the draw spells, each drawn letter used at most once:
 * one pass down the lengths from the whole draw, stopping at the first length
 * that holds one. `null` when no form of `shortest` letters or more does.
 */
export const longestWordsIn = ({
  index,
  letters,
  shortest = LONGEST_WORD_MIN_LENGTH
}: {
  index: FormIndex
  letters: readonly string[]
  shortest?: number
}): LongestWords | null => {
  const counts = countsOf(letters)
  const left = new Int8Array(ALPHABET_LENGTH)
  const missing = ~letters.reduce(
    (mask, letter) => mask | letterBit(letter.charCodeAt(0)),
    0
  )

  for (let length = letters.length; length >= shortest; length--) {
    const bucket = index.get(length)

    if (bucket === undefined) {
      continue
    }

    const words = bucket.forms.filter(
      (word, at) =>
        ((bucket.masks[at] ?? 0) & missing) === 0 &&
        isSpelledWith({ counts, left, word })
    )

    if (words.length > 0) {
      return { length, words }
    }
  }

  return null
}

/** The longest words the reveal names: familiar ones first, in the dictionary's order, three at most. */
export const shownBestWords = ({
  isFamiliar,
  words
}: {
  isFamiliar: (word: string) => boolean
  words: readonly string[]
}): string[] =>
  [
    ...words.filter(isFamiliar),
    ...words.filter((word) => !isFamiliar(word))
  ].slice(0, SHOWN_BEST_WORD_COUNT)
