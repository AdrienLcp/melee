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
