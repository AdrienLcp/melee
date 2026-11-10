import { describe, expect, it } from 'vitest'

import { POINTS_PER_CASE } from '@melee/protocol/board'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'

import { pointsForPlace, REFLEX_PODIUM_SIZE } from './place-pay'

const casesFor = (place: number): number =>
  Math.floor(pointsForPlace({ place }) / POINTS_PER_CASE)

describe('pointsForPlace', () => {
  it('[reflex] pays the fastest the whole round and the next two less', () => {
    expect(pointsForPlace({ place: 0 })).toBe(MOST_A_ROUND_PAYS)
    expect(pointsForPlace({ place: 1 })).toBeLessThan(MOST_A_ROUND_PAYS)
    expect(pointsForPlace({ place: 2 })).toBeLessThan(
      pointsForPlace({ place: 1 })
    )
    expect(pointsForPlace({ place: 2 })).toBeGreaterThan(0)
  })

  it('[reflex] pays nothing past the podium', () => {
    expect(REFLEX_PODIUM_SIZE).toBe(3)
    expect(pointsForPlace({ place: 3 })).toBe(0)
    expect(pointsForPlace({ place: 11 })).toBe(0)
  })

  it('[reflex] walks the podium three, two and one cases', () => {
    expect([0, 1, 2, 3].map(casesFor)).toEqual([3, 2, 1, 0])
  })
})
