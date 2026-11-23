import { describe, expect, it } from 'vitest'

import { type BoardStrategy, POINTS_PER_CASE } from '@melee/protocol/board'
import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { pointsForClue, worthOfClue } from '../fiveclues/clue-pay'
import { isPerfectPay } from '../scoring/perfect-pay'
import { clockedPay } from '../scoring/speed-bonus'
import { pointsFor } from '../scoring/verdict'
import { advanceOnTrack, type PawnRoundResult } from './board-strategy'

const LENGTH = 40
const ROUND_MS = 30_000
const STRATEGIES: readonly BoardStrategy[] = ['onePointOneCase', 'rank']

/** What a round pays an answer worth `earned`, landed `elapsedMs` in, the way the server pays it. */
const paid = ({
  earned,
  elapsedMs,
  paysForSpeed
}: {
  earned: number
  elapsedMs: number
  paysForSpeed: boolean
}): Omit<PawnRoundResult, 'pawnId'> => ({
  isPerfect: isPerfectPay(earned),
  ...(paysForSpeed
    ? clockedPay({ earned, elapsedMs, roundDurationMs: ROUND_MS })
    : { points: earned, speedBonus: 0 })
})

const movesOf = ({
  catchUp = false,
  positions = new Map(),
  results,
  strategy
}: {
  catchUp?: boolean
  positions?: ReadonlyMap<string, number>
  results: readonly PawnRoundResult[]
  strategy: BoardStrategy
}): Record<string, number> =>
  Object.fromEntries(
    advanceOnTrack({
      catchUp,
      length: LENGTH,
      positions,
      results,
      strategy
    }).moves.map((move) => [move.pawnId, move.cases])
  )

describe('a perfect answer walks further than any other', () => {
  it('[board] walks the top step for a perfect answer and two at most for the nearest miss', () => {
    for (const paysForSpeed of [true, false]) {
      for (let earned = 0; earned < MOST_A_ROUND_PAYS; earned += POINT) {
        for (const strategy of STRATEGIES) {
          const moves = movesOf({
            results: [
              {
                pawnId: 'perfect',
                ...paid({
                  earned: MOST_A_ROUND_PAYS,
                  elapsedMs: ROUND_MS,
                  paysForSpeed
                })
              },
              {
                pawnId: 'near',
                ...paid({ earned, elapsedMs: 0, paysForSpeed })
              }
            ],
            strategy
          })

          expect(moves.perfect, `${strategy} against ${earned}`).toBe(3)
          expect(moves.near, `${strategy} against ${earned}`).toBeLessThan(3)
        }
      }
    }
  })

  it('[board] walks a timeline 3, 2 and 1 for nought, one and two pairs swapped, clocked or not', () => {
    for (const paysForSpeed of [true, false]) {
      const results = [0, 1, 2, 3].map((swappedPairs) => ({
        pawnId: `swapped-${swappedPairs}`,
        ...paid({
          earned: pointsFor({ kind: 'order', swappedPairs }),
          elapsedMs: ROUND_MS / 2,
          paysForSpeed
        })
      }))

      expect(movesOf({ results, strategy: 'onePointOneCase' })).toEqual({
        'swapped-0': 3,
        'swapped-1': 2,
        'swapped-2': 1,
        'swapped-3': 0
      })
    }
  })

  it('[board] keeps a colour a shade off below the exact one', () => {
    const results = [0, 0.03, 0.05].map((distance) => ({
      pawnId: `off-${distance}`,
      ...paid({
        earned: pointsFor({ distance, kind: 'colour' }),
        elapsedMs: 0,
        paysForSpeed: false
      })
    }))

    for (const strategy of STRATEGIES) {
      const moves = movesOf({ results, strategy })

      expect(moves['off-0']).toBe(3)
      expect(moves['off-0.03']).toBeLessThan(3)
      expect(moves['off-0.05']).toBeLessThan(3)
    }
  })

  it('[board] keeps a five-clues answer on a later clue below the first, the clock racing both', () => {
    const results = [0, 1].map((clueIndex) => ({
      isPerfect: isPerfectPay(worthOfClue(clueIndex)),
      pawnId: `clue-${clueIndex}`,
      ...pointsForClue({
        clueDurationMs: ROUND_MS,
        clueIndex,
        elapsedInClueMs: clueIndex === 0 ? ROUND_MS : 0,
        paysForSpeed: true
      })
    }))

    for (const strategy of STRATEGIES) {
      const moves = movesOf({ results, strategy })

      expect(moves['clue-0']).toBeGreaterThan(moves['clue-1'] ?? 0)
    }
  })

  it('[board] never lifts the pawn at the back level with a better answer', () => {
    const results: PawnRoundResult[] = [
      {
        pawnId: 'ahead',
        ...paid({
          earned: MOST_A_ROUND_PAYS,
          elapsedMs: ROUND_MS,
          paysForSpeed: true
        })
      },
      {
        pawnId: 'behind',
        ...paid({
          earned: pointsFor({ kind: 'order', swappedPairs: 1 }),
          elapsedMs: 0,
          paysForSpeed: true
        })
      }
    ]
    const positions = new Map([
      ['ahead', 10],
      ['behind', 2]
    ])

    for (const strategy of STRATEGIES) {
      expect(movesOf({ catchUp: true, positions, results, strategy })).toEqual({
        ahead: 3,
        behind: 2
      })
    }
  })

  it('[board] lifts the pawn at the back past one that answered alike', () => {
    const answer = 2 * POINTS_PER_CASE
    const moves = movesOf({
      catchUp: true,
      positions: new Map([
        ['ahead', 10],
        ['behind', 2]
      ]),
      results: [
        { isPerfect: false, pawnId: 'ahead', points: answer, speedBonus: 0 },
        { isPerfect: false, pawnId: 'behind', points: answer, speedBonus: 0 }
      ],
      strategy: 'onePointOneCase'
    })

    expect(moves).toEqual({ ahead: 2, behind: 3 })
  })

  it('[board] lifts the pawn at the back off nought when it scored and nobody better walked one', () => {
    const moves = movesOf({
      catchUp: true,
      positions: new Map([
        ['ahead', 10],
        ['behind', 2]
      ]),
      results: [
        {
          isPerfect: true,
          pawnId: 'ahead',
          points: MOST_A_ROUND_PAYS,
          speedBonus: 0
        },
        {
          isPerfect: false,
          pawnId: 'behind',
          points: 0.5 * POINTS_PER_CASE,
          speedBonus: 0
        }
      ],
      strategy: 'onePointOneCase'
    })

    expect(moves).toEqual({ ahead: 3, behind: 1 })
  })
})
