import { describe, expect, it } from 'vitest'

import { colourHexSchema } from '@melee/protocol/swatch'

import {
  drawSwatchColour,
  MAX_DRAWN_LIGHTNESS,
  MIN_DRAWN_CHROMA,
  MIN_DRAWN_LIGHTNESS
} from './draw'
import { oklabOf } from './oklab'

const ROUNDS = 500
const HEX_ROUNDING = 0.01

describe('the colour a round deals', () => {
  it('[swatch] is a colour every screen can send back', () => {
    for (let round = 0; round < ROUNDS; round++) {
      expect(colourHexSchema.safeParse(drawSwatchColour()).success).toBe(true)
    }
  })

  it('[swatch] stays inside the lightness band and always carries a hue', () => {
    for (let round = 0; round < ROUNDS; round++) {
      const { a, b, lightness } = oklabOf(drawSwatchColour())

      expect(lightness).toBeGreaterThanOrEqual(
        MIN_DRAWN_LIGHTNESS - HEX_ROUNDING
      )
      expect(lightness).toBeLessThanOrEqual(MAX_DRAWN_LIGHTNESS + HEX_ROUNDING)
      expect(Math.hypot(a, b)).toBeGreaterThanOrEqual(
        MIN_DRAWN_CHROMA - HEX_ROUNDING
      )
    }
  })

  it('[swatch] reads its randomness from the argument', () => {
    const fixed = (): number => 0.3

    expect(drawSwatchColour(fixed)).toBe(drawSwatchColour(fixed))
  })
})
