import type { PlayerId } from '@melee/protocol/identifiers'
import type {
  PetitBacLetter,
  PetitBacLineOutcome
} from '@melee/protocol/petit-bac'

import { answerGroupKey, isBlankAnswer } from '../round/answer-groups'
import { paidShare } from '../scoring/round-share'
import { startsWithLetter } from './letter-match'

/**
 * What a line takes of its category's share of the sheet: an answer nobody
 * else wrote takes all of it, one the table shared half — the paper game's own
 * ratio. A line is not a round: the whole sheet is, so a six-category sheet
 * pays what one quiz question does.
 */
export const PETIT_BAC_SHARES = {
  empty: 0,
  offLetter: 0,
  refused: 0,
  shared: 1 / 2,
  unique: 1
} as const satisfies Record<PetitBacLineOutcome, number>

/** What one line of this outcome pays on a sheet of `categoryCount` categories. */
export const linePoints = ({
  categoryCount,
  outcome
}: {
  categoryCount: number
  outcome: PetitBacLineOutcome
}): number => paidShare(PETIT_BAC_SHARES[outcome] / categoryCount)

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

export const sheetPoints = ({
  categoryCount,
  outcomes
}: {
  /** Every category the sheet holds, counted or not yet: what its share is cut from. */
  categoryCount: number
  /** The outcomes of the categories counted so far. */
  outcomes: readonly PetitBacLineOutcome[]
}): number =>
  paidShare(
    outcomes.reduce((total, outcome) => total + PETIT_BAC_SHARES[outcome], 0) /
      categoryCount
  )
