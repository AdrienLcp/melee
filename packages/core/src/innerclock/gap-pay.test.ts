import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import {
  innerclockRoundDurationMs,
  MOST_A_COUNT_PAYS,
  pointsForGap
} from './gap-pay'

describe('what a count pays', () => {
  it('[innerclock] pays the whole of it on the dot', () => {
    expect(pointsForGap({ countedMs: 77_000, targetMs: 77_000 })).toBe(
      MOST_A_COUNT_PAYS
    )
  })

  it('[innerclock] pays an early count and a late one alike', () => {
    const early = pointsForGap({ countedMs: 57_000, targetMs: 60_000 })
    const late = pointsForGap({ countedMs: 63_000, targetMs: 60_000 })

    expect(early).toBe(late)
    expect(early).toBe(2.4 * POINT)
  })

  it('[innerclock] pays nothing a quarter of the target away, or further', () => {
    expect(pointsForGap({ countedMs: 75_000, targetMs: 60_000 })).toBe(0)
    expect(pointsForGap({ countedMs: 20_000, targetMs: 60_000 })).toBe(0)
  })

  it('[innerclock] separates two counts a tenth of a second apart', () => {
    const closer = pointsForGap({ countedMs: 74_300, targetMs: 77_000 })
    const further = pointsForGap({ countedMs: 74_200, targetMs: 77_000 })

    expect(closer).toBeGreaterThan(further)
  })

  it('[innerclock] measures the gap against the target, not in seconds', () => {
    const shortCount = pointsForGap({ countedMs: 23_000, targetMs: 20_000 })
    const longCount = pointsForGap({ countedMs: 93_000, targetMs: 90_000 })

    expect(longCount).toBeGreaterThan(shortCount)
  })
})

describe('how long the presses are waited for', () => {
  it('[innerclock] stops where a press could only pay nothing', () => {
    const capMs = innerclockRoundDurationMs(77_000)

    expect(capMs).toBe(96_250)
    expect(pointsForGap({ countedMs: capMs, targetMs: 77_000 })).toBe(0)
    expect(
      pointsForGap({ countedMs: capMs - 1_000, targetMs: 77_000 })
    ).toBeGreaterThan(0)
  })
})
