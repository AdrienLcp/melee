import type { PlayerId } from '@melee/protocol/identifiers'
import type {
  PetitBacLetter,
  PetitBacLineOutcome
} from '@melee/protocol/petit-bac'
import { POINT } from '@melee/protocol/scoring'

import { answerGroupKey, isBlankAnswer } from '../round/answer-groups'
import { startsWithLetter } from './letter-match'

/** An answer nobody else wrote pays double one the table shared. */
export const PETIT_BAC_POINTS = {
  empty: 0,
  offLetter: 0,
  refused: 0,
  shared: POINT,
  unique: 2 * POINT
} as const satisfies Record<PetitBacLineOutcome, number>

/**
 * Every seat's outcome on one category. Uniqueness is counted over the answers
 * still standing, so an answer two seats share that the room refused is
 * refused for both, and an off-the-letter twin of an accepted answer does not
 * make it shared.
 */
export const categoryOutcomes = ({
  answers,
  letter,
  refusedKeys
}: {
  answers: ReadonlyMap<PlayerId, string | null>
  letter: PetitBacLetter
  /** The group keys the room — or the judge — refused on this category. */
  refusedKeys: ReadonlySet<string>
}): Map<PlayerId, PetitBacLineOutcome> => {
  const outcomes = new Map<PlayerId, PetitBacLineOutcome>()
  const standingAuthors = new Map<string, number>()

  for (const [playerId, text] of answers) {
    if (text === null || isBlankAnswer(text)) {
      outcomes.set(playerId, 'empty')
    } else if (!startsWithLetter({ answer: text, letter })) {
      outcomes.set(playerId, 'offLetter')
    } else if (refusedKeys.has(answerGroupKey(text))) {
      outcomes.set(playerId, 'refused')
    } else {
      const key = answerGroupKey(text)
      standingAuthors.set(key, (standingAuthors.get(key) ?? 0) + 1)
    }
  }

  for (const [playerId, text] of answers) {
    if (text !== null && !outcomes.has(playerId)) {
      const sharedWith = standingAuthors.get(answerGroupKey(text)) ?? 0
      outcomes.set(playerId, sharedWith > 1 ? 'shared' : 'unique')
    }
  }

  return outcomes
}

export const sheetPoints = (outcomes: readonly PetitBacLineOutcome[]): number =>
  outcomes.reduce((total, outcome) => total + PETIT_BAC_POINTS[outcome], 0)
