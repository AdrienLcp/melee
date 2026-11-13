import { describe, expect, it } from 'vitest'

import {
  makeNumberTargetSchema,
  numberTilesSchema
} from '@melee/protocol/make-number'

import { drawNumbers, TILE_BAG } from './tile-draw'

const ROUNDS = 500

const countsOf = (tiles: readonly number[]): Map<number, number> =>
  tiles.reduce(
    (counts, tile) => counts.set(tile, (counts.get(tile) ?? 0) + 1),
    new Map<number, number>()
  )

describe('drawNumbers', () => {
  it('[makenumber] holds twenty-four tiles: 1 to 10 twice, 25, 50, 75 and 100 once', () => {
    expect(TILE_BAG).toHaveLength(24)
    expect(countsOf(TILE_BAG).get(7)).toBe(2)
    expect(countsOf(TILE_BAG).get(75)).toBe(1)
  })

  it('[makenumber] deals six tiles every screen can read and a target from 101 to 999', () => {
    for (let round = 0; round < ROUNDS; round++) {
      const { target, tiles } = drawNumbers()

      expect(numberTilesSchema.safeParse(tiles).success).toBe(true)
      expect(makeNumberTargetSchema.safeParse(target).success).toBe(true)
    }
  })

  it('[makenumber] draws without replacement: never more of a tile than the bag holds', () => {
    const inBag = countsOf(TILE_BAG)

    for (let round = 0; round < ROUNDS; round++) {
      for (const [tile, count] of countsOf(drawNumbers().tiles)) {
        expect(count).toBeLessThanOrEqual(inBag.get(tile) ?? 0)
      }
    }
  })
})
