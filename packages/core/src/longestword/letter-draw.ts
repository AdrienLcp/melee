import { LONGEST_WORD_LETTER_COUNT } from '@melee/protocol/longest-word'
import type { QuestionLanguage } from '@melee/protocol/question'

import { randomUnit, shuffled } from '../helpers/random'

/**
 * The letters a draw counts as vowels. `Y` is one, in both languages: it
 * plays as a vowel in _lycée_ and _rhythm_, and drawn as a consonant it
 * would take a consonant's place in a draw already short of them.
 */
export const VOWELS = ['A', 'E', 'I', 'O', 'U', 'Y'] as const

/** A draw holds three vowels or four, an even chance each. */
export const FEWEST_VOWELS = 3
export const MOST_VOWELS = 4

/** No letter is drawn more than twice: three of one letter make a draw nobody can spell from. */
export const MOST_OF_ONE_LETTER = 2

type LetterWeights = Readonly<Record<string, number>>

/**
 * How often each letter appears in running text, in tenths of a percent,
 * accents folded into their letter. Read off the usual published counts of
 * French and English prose — never a Scrabble bag, whose counts are tuned
 * for a board.
 */
const LETTER_FREQUENCIES: Record<QuestionLanguage, LetterWeights> = {
  en: {
    A: 82,
    B: 15,
    C: 28,
    D: 43,
    E: 127,
    F: 22,
    G: 20,
    H: 61,
    I: 70,
    J: 2,
    K: 8,
    L: 40,
    M: 24,
    N: 67,
    O: 75,
    P: 19,
    Q: 1,
    R: 60,
    S: 63,
    T: 91,
    U: 28,
    V: 10,
    W: 24,
    X: 2,
    Y: 20,
    Z: 1
  },
  fr: {
    A: 82,
    B: 9,
    C: 33,
    D: 37,
    E: 173,
    F: 11,
    G: 9,
    H: 7,
    I: 75,
    J: 5,
    K: 1,
    L: 55,
    M: 30,
    N: 71,
    O: 54,
    P: 30,
    Q: 14,
    R: 66,
    S: 79,
    T: 72,
    U: 63,
    V: 16,
    W: 1,
    X: 4,
    Y: 3,
    Z: 1
  }
}

const isVowel = (letter: string): boolean =>
  VOWELS.some((vowel) => vowel === letter)

const weightedPick = (
  weights: readonly (readonly [string, number])[]
): string => {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  let left = randomUnit() * total

  for (const [letter, weight] of weights) {
    left -= weight

    if (left < 0) {
      return letter
    }
  }

  return weights.at(-1)?.[0] ?? 'E'
}

const drawnFrom = ({
  count,
  weights
}: {
  count: number
  weights: readonly (readonly [string, number])[]
}): string[] => {
  const drawn: string[] = []

  while (drawn.length < count) {
    const open = weights.filter(
      ([letter]) =>
        drawn.filter((held) => held === letter).length < MOST_OF_ONE_LETTER
    )

    drawn.push(weightedPick(open))
  }

  return drawn
}

/**
 * Nine letters for a round: three or four vowels and the rest consonants,
 * each drawn by how often the language writes it, none more than twice, then
 * shuffled so the vowels do not sit together. Whether the dictionary holds a
 * long word from them is `drawPlayableLetters`'s question.
 */
export const drawLetters = (language: QuestionLanguage): string[] => {
  const weights = Object.entries(LETTER_FREQUENCIES[language])
  const vowelCount = randomUnit() < 0.5 ? FEWEST_VOWELS : MOST_VOWELS

  return shuffled([
    ...drawnFrom({
      count: vowelCount,
      weights: weights.filter(([letter]) => isVowel(letter))
    }),
    ...drawnFrom({
      count: LONGEST_WORD_LETTER_COUNT - vowelCount,
      weights: weights.filter(([letter]) => !isVowel(letter))
    })
  ])
}

/** How many of a draw's letters are vowels. */
export const vowelCountOf = (letters: readonly string[]): number =>
  letters.filter(isVowel).length
