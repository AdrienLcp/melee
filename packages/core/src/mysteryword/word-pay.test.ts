import { describe, expect, it } from 'vitest'

import { MYSTERY_WORD_TRY_COUNT } from '@melee/protocol/mystery-word'
import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { clockedPay } from '../scoring/speed-bonus'
import { pointsForWord } from './word-pay'

describe('pointsForWord', () => {
  it('[mysteryword] pays the whole round on the first two tries, then less each try', () => {
    expect(pointsForWord({ foundOnTry: 1 })).toBe(MOST_A_ROUND_PAYS)
    expect(pointsForWord({ foundOnTry: 2 })).toBe(MOST_A_ROUND_PAYS)
    expect(pointsForWord({ foundOnTry: 3 })).toBe(85 * POINT)
    expect(pointsForWord({ foundOnTry: 4 })).toBe(70 * POINT)
    expect(pointsForWord({ foundOnTry: 5 })).toBe(55 * POINT)
    expect(pointsForWord({ foundOnTry: MYSTERY_WORD_TRY_COUNT })).toBe(
      40 * POINT
    )
  })

  it('[mysteryword] pays nothing for a word never found', () => {
    expect(pointsForWord({ foundOnTry: null })).toBe(0)
  })

  it('[mysteryword] pays a word found on the third try less than one found late on the second', () => {
    const lateSecond = clockedPay({
      earned: pointsForWord({ foundOnTry: 2 }),
      elapsedMs: 119_000,
      roundDurationMs: 120_000
    })
    const quickThird = clockedPay({
      earned: pointsForWord({ foundOnTry: 3 }),
      elapsedMs: 1_000,
      roundDurationMs: 120_000
    })

    expect(quickThird.points).toBeLessThan(lateSecond.points)
  })
})
