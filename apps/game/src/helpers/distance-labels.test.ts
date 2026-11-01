import { describe, expect, it } from 'vitest'

import {
  crowdedPawnScale,
  type DistanceLine,
  labelSize,
  placedDistanceLabels
} from './distance-labels'
import type { Point } from './map-view'

const frame = { height: 400, width: 400 }
const pawn = { height: 28, width: 24 }

const straight = ({ from, to }: { from: Point; to: Point }): DistanceLine => ({
  characters: 6,
  from,
  pointAt: (share) => [
    from[0] + (to[0] - from[0]) * share,
    from[1] + (to[1] - from[1]) * share
  ]
})

describe('distance labels', () => {
  it('[map] stands a lone label on its own line, the pawn end first', () => {
    const [at] = placedDistanceLabels({
      fontSize: 14,
      frame,
      lines: [straight({ from: [100, 300], to: [300, 100] })],
      obstacles: [],
      pawn
    })

    expect(at).toEqual([160, 240])
  })

  it('[map] follows a curved line rather than its chord', () => {
    const [at] = placedDistanceLabels({
      fontSize: 14,
      frame,
      lines: [
        {
          characters: 6,
          from: [100, 300],
          pointAt: (share) => [
            100 + 200 * share,
            300 - 400 * share * (1 - share)
          ]
        }
      ],
      obstacles: [],
      pawn
    })

    expect(at).toEqual([160, 216])
  })

  it('[map] moves a label off one already placed rather than printing over it', () => {
    const lines = [
      straight({ from: [100, 300], to: [300, 100] }),
      straight({ from: [102, 300], to: [300, 102] })
    ]
    const [first, second] = placedDistanceLabels({
      fontSize: 14,
      frame,
      lines,
      obstacles: [],
      pawn
    })
    const size = labelSize({ fontSize: 14, length: 6 })

    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(
      Math.abs((first?.[0] ?? 0) - (second?.[0] ?? 0)) >= size.width ||
        Math.abs((first?.[1] ?? 0) - (second?.[1] ?? 0)) >= size.height
    ).toBe(true)
  })

  it('[map] leaves out a label with nowhere free, for the list to carry', () => {
    const [at] = placedDistanceLabels({
      fontSize: 14,
      frame,
      lines: [straight({ from: [100, 300], to: [300, 100] })],
      obstacles: [{ height: 400, width: 400, x: 0, y: 0 }],
      pawn
    })

    expect(at).toBeNull()
  })

  it('[map] keeps pawns whole until two stand closer than a pawn', () => {
    expect(
      crowdedPawnScale({
        pawnWidth: 24,
        points: [
          [0, 0],
          [100, 0]
        ]
      })
    ).toBe(1)
    expect(
      crowdedPawnScale({
        pawnWidth: 24,
        points: [
          [0, 0],
          [18, 0]
        ]
      })
    ).toBe(0.75)
    expect(
      crowdedPawnScale({
        pawnWidth: 24,
        points: [
          [0, 0],
          [1, 0]
        ]
      })
    ).toBe(0.6)
  })

  it('[map] keeps a lone pawn whole', () => {
    expect(crowdedPawnScale({ pawnWidth: 24, points: [[0, 0]] })).toBe(1)
  })
})
