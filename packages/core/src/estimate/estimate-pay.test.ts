import { describe, expect, it } from 'vitest'

import { playerIdSchema } from '@melee/protocol/identifiers'
import { POINT } from '@melee/protocol/scoring'

import {
  estimateVerdictsOf,
  gapOf,
  isSpotOn,
  pointsForEstimate
} from './estimate-pay'

const seat = (id: string) => playerIdSchema.parse(id)

const placesOf = (
  guesses: readonly { guess: number; playerId: string }[],
  truth: number
) =>
  Object.fromEntries(
    [
      ...estimateVerdictsOf({
        guesses: guesses.map(({ guess, playerId }) => ({
          guess,
          playerId: seat(playerId)
        })),
        truth
      })
    ].map(([playerId, { placesFromBest }]) => [playerId, placesFromBest])
  )

describe('how an estimate is measured', () => {
  it('[estimate] reads the same miss on either side as the same gap', () => {
    expect(gapOf(0.8)).toBeCloseTo(gapOf(1.25))
  })

  it('[estimate] reads a miss by its ratio, whatever the zeros', () => {
    expect(gapOf(100e6 / 124e6)).toBeCloseTo(gapOf(10_000 / 12_400))
  })

  it('[estimate] calls an estimate spot on within 2 % and no further', () => {
    expect(isSpotOn({ ratio: 1.019 })).toBe(true)
    expect(isSpotOn({ ratio: 1 / 1.019 })).toBe(true)
    expect(isSpotOn({ ratio: 1.03 })).toBe(false)
  })
})

describe('what an estimate pays', () => {
  it('[estimate] pays the three closest seats 3, 2 and 1', () => {
    const places = placesOf(
      [
        { guess: 120, playerId: 'near' },
        { guess: 150, playerId: 'middle' },
        { guess: 60, playerId: 'far' },
        { guess: 40, playerId: 'farthest' }
      ],
      100
    )

    expect(places).toEqual({ far: 2, farthest: 3, middle: 1, near: 0 })
    expect(pointsForEstimate({ placesFromBest: 0 })).toBe(3 * POINT)
    expect(pointsForEstimate({ placesFromBest: 2 })).toBe(POINT)
    expect(pointsForEstimate({ placesFromBest: 3 })).toBe(0)
  })

  it('[estimate] shares a place between equal estimates and skips the next', () => {
    const places = placesOf(
      [
        { guess: 90, playerId: 'one' },
        { guess: 90, playerId: 'two' },
        { guess: 200, playerId: 'three' }
      ],
      100
    )

    expect(places).toEqual({ one: 0, three: 2, two: 0 })
  })

  it('[estimate] pays nothing eleven times too high, even in a room of two', () => {
    const places = placesOf(
      [
        { guess: 1_100, playerId: 'wild' },
        { guess: 1_000, playerId: 'edge' }
      ],
      100
    )

    expect(places).toEqual({ edge: 0, wild: null })
    expect(pointsForEstimate({ placesFromBest: null })).toBe(0)
  })

  it('[estimate] ranks the seats in reach without counting the ones beyond it', () => {
    const places = placesOf(
      [
        { guess: 0.001, playerId: 'wild' },
        { guess: 300, playerId: 'rough' }
      ],
      100
    )

    expect(places).toEqual({ rough: 0, wild: null })
  })
})
