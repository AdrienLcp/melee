import { describe, expect, it } from 'vitest'

import { calculationValue } from './calculation-check'
import { shortestSolution } from './shortest-solution'
import { drawNumbers } from './tile-draw'

const TILES = [75, 25, 7, 3, 10, 10]

describe('shortestSolution', () => {
  it('[makenumber] makes the target with steps the check accepts', () => {
    const steps = shortestSolution({ target: 703, tiles: TILES })

    expect(steps).not.toBeNull()
    expect(calculationValue({ steps: steps ?? [], tiles: TILES })).toBe(703)
  })

  it('[makenumber] uses the fewest tiles the draw allows', () => {
    expect(shortestSolution({ target: 703, tiles: TILES })).toHaveLength(3)
    expect(shortestSolution({ target: 750, tiles: TILES })).toHaveLength(1)
    expect(shortestSolution({ target: 760, tiles: TILES })).toHaveLength(2)
  })

  it('[makenumber] finds a solution needing every tile', () => {
    const tiles = [2, 2, 2, 2, 2, 2]
    const steps = shortestSolution({ target: 64, tiles })

    expect(steps).toHaveLength(5)
    expect(calculationValue({ steps: steps ?? [], tiles })).toBe(64)
  })

  it('[makenumber] subtracts and divides only where the rule allows', () => {
    const tiles = [100, 4, 1, 1, 1, 1]

    expect(shortestSolution({ target: 25, tiles })).toEqual([
      { left: 0, operator: 'divide', right: 1 }
    ])
    expect(shortestSolution({ target: 96, tiles })).toEqual([
      { left: 0, operator: 'subtract', right: 1 }
    ])
  })

  it('[makenumber] answers null for a target no subset reaches', () => {
    expect(shortestSolution({ target: 999, tiles: [1, 1, 1, 1, 1, 1] })).toBe(
      null
    )
  })

  it('[makenumber] hands back a solution the check accepts on every exact draw', () => {
    for (let round = 0; round < 50; round++) {
      const { target, tiles } = drawNumbers()
      const steps = shortestSolution({ target, tiles })

      if (steps !== null && steps.length > 0) {
        expect(calculationValue({ steps, tiles })).toBe(target)
      }
    }
  })
})
