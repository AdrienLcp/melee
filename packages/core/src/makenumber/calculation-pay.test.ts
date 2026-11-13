import { describe, expect, it } from 'vitest'

import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { clockedPay } from '../scoring/speed-bonus'
import { isExactHit, pointsForCalculation } from './calculation-pay'

const ROUND_MS = 60_000

describe('pointsForCalculation', () => {
  it('[makenumber] pays an exact hit the whole round and a miss a tenth less per unit off', () => {
    expect(pointsForCalculation({ distance: 0 })).toBe(MOST_A_ROUND_PAYS)
    expect(pointsForCalculation({ distance: 1 })).toBe(90 * POINT)
    expect(pointsForCalculation({ distance: 3 })).toBe(70 * POINT)
    expect(pointsForCalculation({ distance: 9 })).toBe(10 * POINT)
  })

  it('[makenumber] pays ten away or more nothing', () => {
    expect(pointsForCalculation({ distance: 10 })).toBe(0)
    expect(pointsForCalculation({ distance: 400 })).toBe(0)
  })

  it('[makenumber] keeps nine tenths of a miss, 81 printed points one away, and races only an exact hit', () => {
    const quickMiss = clockedPay({
      earned: pointsForCalculation({ distance: 1 }),
      elapsedMs: 1_000,
      roundDurationMs: ROUND_MS
    })
    const lateHit = clockedPay({
      earned: pointsForCalculation({ distance: 0 }),
      elapsedMs: 59_000,
      roundDurationMs: ROUND_MS
    })

    expect(quickMiss).toEqual({ points: 81 * POINT, speedBonus: 0 })
    expect(lateHit.speedBonus).toBeGreaterThan(0)
    expect(lateHit.points).toBeGreaterThan(quickMiss.points)
  })
})

describe('isExactHit', () => {
  it('[makenumber] holds the target itself and nothing one away', () => {
    expect(isExactHit({ distance: 0 })).toBe(true)
    expect(isExactHit({ distance: 1 })).toBe(false)
  })
})
