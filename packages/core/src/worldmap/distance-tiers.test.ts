import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import { pointsForDistance } from './distance-tiers'

describe('what a marker earns by how far it fell', () => {
  it('[worldmap] pays the typed answer’s price inside the country', () => {
    expect(pointsForDistance(0)).toBe(3 * POINT)
  })

  it('[worldmap] still pays a neighbour, less the further it falls', () => {
    expect(pointsForDistance(1)).toBe(2 * POINT)
    expect(pointsForDistance(499)).toBe(2 * POINT)
    expect(pointsForDistance(500)).toBe(POINT)
    expect(pointsForDistance(1_499)).toBe(POINT)
  })

  it('[worldmap] pays nothing past the last tier', () => {
    expect(pointsForDistance(1_500)).toBe(0)
    expect(pointsForDistance(20_000)).toBe(0)
  })
})
