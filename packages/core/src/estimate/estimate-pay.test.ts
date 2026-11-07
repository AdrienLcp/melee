import { describe, expect, it } from 'vitest'

import { playerIdSchema } from '@melee/protocol/identifiers'
import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import {
  estimateVerdictsOf,
  gapOf,
  isSpotOn,
  pointsForEstimate
} from './estimate-pay'

const paidFor = (guess: number, truth = 100): number =>
  pointsForEstimate({ ratio: guess / truth })

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
  it('[estimate] pays the whole round on the truth', () => {
    expect(paidFor(100)).toBe(MOST_A_ROUND_PAYS)
  })

  it('[estimate] pays for precision, falling with the miss', () => {
    expect(Math.round(paidFor(110) / POINT)).toBe(91)
    expect(Math.round(paidFor(125) / POINT)).toBe(80)
    expect(Math.round(paidFor(150) / POINT)).toBe(63)
    expect(Math.round(paidFor(200) / POINT)).toBe(37)
  })

  it('[estimate] pays the same miss on either side the same', () => {
    expect(paidFor(50)).toBe(paidFor(200))
  })

  /**
   * The game night's case: a truth of 100 and three guesses near a thousand,
   * which a podium paid 3, 2 and 1 for being the room's least far off.
   */
  it('[estimate] pays nothing far off, however few seats were closer', () => {
    expect(paidFor(900)).toBe(0)
    expect(paidFor(950)).toBe(0)
    expect(paidFor(1_000)).toBe(0)
    expect(paidFor(300)).toBe(0)
    expect(paidFor(30)).toBe(0)
  })

  it('[estimate] measures every seat against the truth alone', () => {
    const verdicts = estimateVerdictsOf({
      guesses: [
        { guess: 120, playerId: playerIdSchema.parse('near') },
        { guess: 40, playerId: playerIdSchema.parse('far') }
      ],
      truth: 100
    })

    expect(Object.fromEntries(verdicts)).toEqual({
      far: { kind: 'number', ratio: 0.4 },
      near: { kind: 'number', ratio: 1.2 }
    })
  })
})
