import type { QuizDeckItem } from '@melee/protocol/deck'

import { normalizeAnswer } from '../round/answer-matching'
import { decoysGradedRight, spellingsNamingADecoy } from './decoy-checks'

const itemProblems = ({
  item,
  path
}: {
  item: QuizDeckItem
  path: string
}): string[] => {
  const answer = normalizeAnswer(item.answer)
  const decoyKeys = item.decoys.map(normalizeAnswer)
  const sameAsAnswer = item.decoys.flatMap((decoy, index) =>
    decoyKeys[index] === answer
      ? [`${path}.decoys[${index}]: “${decoy}” is the answer itself.`]
      : []
  )
  const repeated = item.decoys.flatMap((decoy, index) =>
    decoyKeys.indexOf(decoyKeys[index] ?? '') < index
      ? [`${path}.decoys[${index}]: “${decoy}” is another decoy again.`]
      : []
  )
  const paid = decoysGradedRight(item)
    .filter((decoy) => normalizeAnswer(decoy) !== answer)
    .map(
      (decoy) =>
        `${path}.decoys[${item.decoys.indexOf(decoy)}]: “${decoy}” would be graded right — a decoy must not be a spelling of the answer.`
    )
  const acceptedWrong = spellingsNamingADecoy(item).map(
    ({ decoy, spelling }) =>
      `${path}.accepted[${item.accepted.indexOf(spelling)}]: “${spelling}” also names the decoy “${decoy}”.`
  )

  return [...sameAsAnswer, ...repeated, ...paid, ...acceptedWrong]
}

/**
 * Everything wrong with a quiz deck, each problem led by its path under
 * `path`: a decoy that is the answer or a spelling of it, a decoy given twice,
 * an accepted spelling that names a decoy. Empty when the deck holds.
 */
export const quizDeckProblems = ({
  items,
  path
}: {
  items: readonly QuizDeckItem[]
  path: string
}): string[] =>
  items.flatMap((item, index) =>
    itemProblems({ item, path: `${path}.items[${index}]` })
  )
