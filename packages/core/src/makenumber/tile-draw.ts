import {
  MAKE_NUMBER_HIGHEST_TARGET,
  MAKE_NUMBER_LOWEST_TARGET,
  MAKE_NUMBER_TILE_COUNT
} from '@melee/protocol/make-number'

import { randomIntBetween, shuffled } from '../helpers/random'

const SMALL_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

/** The twenty-four tiles a round deals six of: 1 to 10 twice each, then 25, 50, 75 and 100 once. */
export const TILE_BAG: readonly number[] = [
  ...SMALL_TILES,
  ...SMALL_TILES,
  25,
  50,
  75,
  100
]

export type NumberDraw = { target: number; tiles: number[] }

/** Six tiles drawn from the bag without replacement, in the order drawn, and a target uniform over its range. */
export const drawNumbers = (): NumberDraw => ({
  target: randomIntBetween(
    MAKE_NUMBER_LOWEST_TARGET,
    MAKE_NUMBER_HIGHEST_TARGET
  ),
  tiles: shuffled(TILE_BAG).slice(0, MAKE_NUMBER_TILE_COUNT)
})
