import { describe, expect, it } from 'vitest'

import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { clockedPay } from '../scoring/speed-bonus'
import { isLongestInDraw, pointsForLetters } from './letters-pay'

describe('pointsForLetters', () => {
  it('[longestword] pays a word by its length past three over the best word’s', () => {
    expect(pointsForLetters({ bestLength: 8, length: 8 })).toBe(
      MOST_A_ROUND_PAYS
    )
    expect(pointsForLetters({ bestLength: 8, length: 7 })).toBe(80 * POINT)
    expect(pointsForLetters({ bestLength: 8, length: 4 })).toBe(20 * POINT)
    expect(pointsForLetters({ bestLength: 7, length: 5 })).toBe(50 * POINT)
  })

  it('[longestword] pays three letters or fewer nothing', () => {
    expect(pointsForLetters({ bestLength: 7, length: 3 })).toBe(0)
    expect(pointsForLetters({ bestLength: 9, length: 2 })).toBe(0)
  })

  it('[longestword] lets a word as long as the best race the clock, and a shorter one never', () => {
    const lateBest = clockedPay({
      earned: pointsForLetters({ bestLength: 8, length: 8 }),
      elapsedMs: 44_000,
      roundDurationMs: 45_000
    })
    const quickShorter = clockedPay({
      earned: pointsForLetters({ bestLength: 8, length: 7 }),
      elapsedMs: 1_000,
      roundDurationMs: 45_000
    })

    expect(lateBest.speedBonus).toBeGreaterThan(0)
    expect(quickShorter.speedBonus).toBe(0)
    expect(quickShorter.points).toBeLessThan(lateBest.points)
  })
})

describe('isLongestInDraw', () => {
  it('[longestword] holds a word as long as the draw’s longest, and not a shorter one', () => {
    expect(isLongestInDraw({ bestLength: 8, length: 8 })).toBe(true)
    expect(isLongestInDraw({ bestLength: 8, length: 7 })).toBe(false)
  })
})
