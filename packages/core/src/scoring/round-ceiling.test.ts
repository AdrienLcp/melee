import { describe, expect, it } from 'vitest'

import type { GameKind } from '@melee/protocol/game'
import { playerIdSchema } from '@melee/protocol/identifiers'
import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { pointsForDistance } from '../atlas/distance-pay'
import { pointsForCells } from '../blacksquare/sheet-pay'
import { pointsForPlace } from '../challenge/place-pay'
import { pointsForEstimate } from '../estimate/estimate-pay'
import { pointsForPairs } from '../higherlower/pairs-pay'
import { pointsForGap } from '../innerclock/gap-pay'
import { pointsForLetters } from '../longestword/letters-pay'
import { pointsForMove } from '../matchsticks/move-pay'
import { POINTS_FOR_VOTING_WITH_THE_ROOM } from '../mostlikely/tally'
import { pointsForWord } from '../mysteryword/word-pay'
import { sheetPoints as petitBacSheetPoints } from '../petitbac/sheet-pay'
import { answerGroupKey } from '../round/answer-groups'
import { sheetPoints as slateSheetPoints } from '../slate/sheet-marking'
import { pointsForColour } from '../swatch/colour-pay'
import { pointsForOrder } from '../timeline/order-pay'
import { clockedPay } from './speed-bonus'
import { pointsFor } from './verdict'

const ANA = playerIdSchema.parse('ana')
const NINE_CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

/**
 * The best round each game can pay, before any clock. A `Record` over every
 * game, so the next one on the shelf cannot ship without saying what its best
 * round is worth.
 */
const BEST_ROUND = {
  atlas: () => pointsForDistance({ distanceKm: 0, target: 'country' }),
  blacksquare: () =>
    pointsForCells({
      cellTiers: [1, 1, 1, 2, 2, 2, 3, 3, 3],
      doubledCells: NINE_CELLS,
      foundCells: NINE_CELLS,
      hitBlackWord: false
    }),
  blindtest: () =>
    pointsFor({ artistCorrect: true, kind: 'halves', titleCorrect: true }),
  buzzer: () => pointsFor({ isCorrect: true, kind: 'single' }),
  challenge: () => pointsForPlace(1),
  estimate: () => pointsForEstimate({ ratio: 1 }),
  higherlower: () => pointsForPairs({ rightPairs: 5 }),
  innerclock: () => pointsForGap({ countedMs: 30_000, targetMs: 30_000 }),
  longestword: () => pointsForLetters({ bestLength: 9, length: 9 }),
  matchsticks: () => pointsForMove({ placesFromBest: 0 }),
  mostlikely: () => POINTS_FOR_VOTING_WITH_THE_ROOM,
  mysteryword: () => pointsForWord({ foundOnTry: 1 }),
  petitbac: () =>
    petitBacSheetPoints({
      categoryCount: 6,
      outcomes: Array.from({ length: 6 }, () => 'unique' as const)
    }),
  quiz: () => pointsFor({ isCorrect: true, kind: 'single' }),
  reflex: () => pointsFor({ isCorrect: true, kind: 'single' }),
  slate: () =>
    slateSheetPoints({
      items: Array.from({ length: 60 }, () => ({
        marking: {
          judged: new Map([[answerGroupKey('sel'), true]]),
          passed: true
        },
        roster: new Set([ANA]),
        state: 'closed' as const
      })),
      playerId: ANA,
      sheet: new Map(Array.from({ length: 60 }, (_, index) => [index, 'sel']))
    }),
  swatch: () => pointsForColour({ distance: 0 }),
  timeline: () => pointsForOrder({ swappedPairs: 0 })
} as const satisfies Record<GameKind, () => number>

describe('one scale for every game', () => {
  /**
   * The balance guarantee: a player strong at one game cannot run away with
   * an evening, because no game's best round is worth more than another's.
   */
  it.each(Object.entries(BEST_ROUND))(
    '[scoring] pays %s’s best round exactly a hundred printed points',
    (_, bestRound) => {
      expect(bestRound()).toBe(MOST_A_ROUND_PAYS)
      expect(bestRound() / POINT).toBe(100)
    }
  )

  it('[scoring] keeps the ceiling with the clock on, answered at nought', () => {
    expect(
      clockedPay({
        earned: MOST_A_ROUND_PAYS,
        elapsedMs: 0,
        roundDurationMs: 30_000
      }).points
    ).toBe(MOST_A_ROUND_PAYS)
  })
})
