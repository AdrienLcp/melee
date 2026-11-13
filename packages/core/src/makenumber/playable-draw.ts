import type { CalculationStep } from '@melee/protocol/make-number'

import { shortestSolution } from './shortest-solution'
import { drawNumbers, type NumberDraw } from './tile-draw'

/**
 * The fewest tiles a draw's shortest solution may use: a target one
 * operation away is over before the table has read it.
 */
export const FEWEST_TILES_A_SOLUTION_USES = 3

/** Draws tried before giving up, far past what the bag needs: almost every draw is exact. */
export const MOST_DRAW_ATTEMPTS = 500

export type PlayableNumbers = NumberDraw & {
  /** One exact calculation using the fewest tiles the draw allows, `FEWEST_TILES_A_SOLUTION_USES` or more. */
  solution: CalculationStep[]
}

/**
 * Six tiles and a target they make exactly, from three tiles up, redrawn
 * until they do, with the draw's shortest solution. `null` only for a drawer
 * that never deals one, which the bag never is.
 */
export const drawPlayableNumbers = ({
  draw = drawNumbers
}: {
  /** Where each draw comes from: the bag unless a test says otherwise. */
  draw?: () => NumberDraw
} = {}): PlayableNumbers | null => {
  for (let attempt = 0; attempt < MOST_DRAW_ATTEMPTS; attempt++) {
    const { target, tiles } = draw()
    const solution = shortestSolution({ target, tiles })

    if (
      solution !== null &&
      solution.length >= FEWEST_TILES_A_SOLUTION_USES - 1
    ) {
      return { solution, target, tiles }
    }
  }

  return null
}
