import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import {
  FULL_PAY_DISTANCE,
  isExactColour,
  MOST_A_COLOUR_PAYS,
  pointsForColour,
  ZERO_PAY_DISTANCE
} from './colour-pay'
import { drawSwatchColour } from './draw'
import { colourDistance } from './oklab'

describe('what a rebuilt colour pays', () => {
  it('[swatch] pays the whole of it on the colour and within the eye’s threshold', () => {
    expect(pointsForColour({ distance: 0 })).toBe(MOST_A_COLOUR_PAYS)
    expect(pointsForColour({ distance: FULL_PAY_DISTANCE })).toBe(
      MOST_A_COLOUR_PAYS
    )
  })

  it('[swatch] falls linearly to nothing at the far edge', () => {
    const halfway = (FULL_PAY_DISTANCE + ZERO_PAY_DISTANCE) / 2

    expect(pointsForColour({ distance: halfway })).toBe(1.5 * POINT)
    expect(pointsForColour({ distance: ZERO_PAY_DISTANCE })).toBe(0)
    expect(pointsForColour({ distance: 0.6 })).toBe(0)
  })

  it('[swatch] separates two near misses, the nearer one higher', () => {
    expect(pointsForColour({ distance: 0.05 })).toBeGreaterThan(
      pointsForColour({ distance: 0.051 })
    )
  })

  it('[swatch] calls a colour exact only within the threshold', () => {
    expect(isExactColour({ distance: FULL_PAY_DISTANCE })).toBe(true)
    expect(isExactColour({ distance: FULL_PAY_DISTANCE + 0.001 })).toBe(false)
  })

  it('[swatch] pays a mid grey sent every round almost never', () => {
    const rounds = Array.from({ length: 2_000 }, () => drawSwatchColour())
    const paid = rounds.filter(
      (shown: string) =>
        pointsForColour({
          distance: colourDistance({ sent: '#9b9b9b', shown })
        }) > 0
    )

    expect(paid.length / rounds.length).toBeLessThan(0.15)
  })
})
