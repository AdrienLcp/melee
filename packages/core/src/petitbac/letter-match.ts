import type { PetitBacLetter } from '@melee/protocol/petit-bac'

import {
  normalizeAnswer,
  normalizeKeepingArticle
} from '../round/answer-matching'

/**
 * Whether an answer plays for the round's letter. A leading article counts
 * both ways — *La Rochelle* plays for *L* and for *R*, *L'Oréal* for *L* and
 * for *O* — because a table argues either and neither is cheating.
 */
export const startsWithLetter = ({
  answer,
  letter
}: {
  answer: string
  letter: PetitBacLetter
}): boolean => {
  const initial = letter.toLowerCase()

  return (
    normalizeAnswer(answer).startsWith(initial) ||
    normalizeKeepingArticle(answer).startsWith(initial)
  )
}

/** The shortest folded line a stop accepts: an initial alone is not an answer. */
export const MIN_STOPPABLE_LETTERS = 2

/**
 * Whether a line lets its sheet call stop: on the letter, and more than an
 * initial. A sheet of `B` six times would otherwise close every other sheet
 * for nothing but speed.
 */
export const isStoppableLine = ({
  answer,
  letter
}: {
  answer: string
  letter: PetitBacLetter
}): boolean =>
  startsWithLetter({ answer, letter }) &&
  normalizeKeepingArticle(answer).length >= MIN_STOPPABLE_LETTERS
