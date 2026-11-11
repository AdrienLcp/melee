import type { QuestionLanguage } from '@melee/protocol/question'

import { drawLetters } from './letter-draw'
import { type FormIndex, longestWordsIn } from './longest-words'

/** The shortest longest word a draw may hold: a draw whose best is six letters is redrawn. */
export const LONGEST_WORD_FLOOR = 7

/** Draws tried before giving up, far past what a real dictionary needs: a draw holds a seven within a few. */
export const MOST_DRAW_ATTEMPTS = 500

export type PlayableDraw = {
  /** How long the draw's longest word is, `LONGEST_WORD_FLOOR` or more. */
  bestLength: number
  /** Every form of that length the draw spells, in the dictionary's order. */
  bestWords: string[]
  letters: string[]
}

/**
 * Nine letters the dictionary holds a word of at least `LONGEST_WORD_FLOOR`
 * letters from, redrawn until it does, with the draw's longest words. `null`
 * only for a dictionary that never answers, which no real language is.
 */
export const drawPlayableLetters = ({
  draw = drawLetters,
  index,
  language
}: {
  /** Where each draw comes from: the language's letter frequencies unless a test says otherwise. */
  draw?: (language: QuestionLanguage) => string[]
  index: FormIndex
  language: QuestionLanguage
}): PlayableDraw | null => {
  for (let attempt = 0; attempt < MOST_DRAW_ATTEMPTS; attempt++) {
    const letters = draw(language)
    const best = longestWordsIn({
      index,
      letters,
      shortest: LONGEST_WORD_FLOOR
    })

    if (best !== null) {
      return { bestLength: best.length, bestWords: best.words, letters }
    }
  }

  return null
}
