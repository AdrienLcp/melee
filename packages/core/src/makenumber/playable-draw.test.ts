import { describe, expect, it } from 'vitest'

import { calculationValue } from './calculation-check'
import {
  drawPlayableNumbers,
  FEWEST_TILES_A_SOLUTION_USES,
  MOST_DRAW_ATTEMPTS
} from './playable-draw'
import type { NumberDraw } from './tile-draw'

const TILES = [75, 25, 7, 3, 10, 10]
const UNREACHABLE: NumberDraw = { target: 999, tiles: [1, 1, 1, 1, 1, 1] }
const ONE_STEP: NumberDraw = { target: 750, tiles: TILES }
const THREE_STEPS: NumberDraw = { target: 703, tiles: TILES }

const drawsInTurn = (draws: readonly NumberDraw[]) => {
  let next = 0

  return () => {
    const draw = draws[next % draws.length] ?? UNREACHABLE

    next++

    return draw
  }
}

describe('drawPlayableNumbers', () => {
  it('[makenumber] redraws until the target is exact and needs three tiles or more', () => {
    expect(FEWEST_TILES_A_SOLUTION_USES).toBe(3)

    const drawn = drawPlayableNumbers({
      draw: drawsInTurn([UNREACHABLE, ONE_STEP, THREE_STEPS])
    })

    expect(drawn?.target).toBe(703)
    expect(drawn?.tiles).toEqual(TILES)
    expect(drawn?.solution).toHaveLength(3)
    expect(
      calculationValue({ steps: drawn?.solution ?? [], tiles: TILES })
    ).toBe(703)
  })

  it('[makenumber] gives up on a drawer that never deals a playable draw', () => {
    let draws = 0

    expect(
      drawPlayableNumbers({
        draw: () => {
          draws++

          return ONE_STEP
        }
      })
    ).toBeNull()
    expect(draws).toBe(MOST_DRAW_ATTEMPTS)
  })

  it('[makenumber] deals a playable draw from the bag', () => {
    const drawn = drawPlayableNumbers()

    expect(drawn).not.toBeNull()
    expect(drawn?.solution.length).toBeGreaterThanOrEqual(2)
  })
})
