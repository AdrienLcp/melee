import { describe, expect, it } from 'vitest'

import { colourDistance, hexOf, oklabOf } from './oklab'

describe('a colour in OKLab', () => {
  it('[swatch] puts white at lightness one and black at nought, with no hue', () => {
    const white = oklabOf('#ffffff')
    const black = oklabOf('#000000')

    expect(white.lightness).toBeCloseTo(1, 4)
    expect(Math.hypot(white.a, white.b)).toBeLessThan(1e-4)
    expect(black.lightness).toBeCloseTo(0, 6)
  })

  it('[swatch] matches the reference value for pure red', () => {
    const red = oklabOf('#ff0000')

    expect(red.lightness).toBeCloseTo(0.628, 3)
    expect(red.a).toBeCloseTo(0.2249, 3)
    expect(red.b).toBeCloseTo(0.1258, 3)
  })

  it('[swatch] comes back to the same hex', () => {
    for (const hex of ['#3a7bd5', '#e8c547', '#00a86b', '#7f7f7f']) {
      expect(hexOf(oklabOf(hex))).toBe(hex)
    }
  })
})

describe('how far apart two colours look', () => {
  it('[swatch] is nought between a colour and itself', () => {
    expect(colourDistance({ sent: '#3a7bd5', shown: '#3a7bd5' })).toBe(0)
  })

  it('[swatch] is one from black to white', () => {
    expect(colourDistance({ sent: '#000000', shown: '#ffffff' })).toBeCloseTo(
      1,
      4
    )
  })

  it('[swatch] is the same whichever way it is measured', () => {
    expect(colourDistance({ sent: '#e8c547', shown: '#00a86b' })).toBe(
      colourDistance({ sent: '#00a86b', shown: '#e8c547' })
    )
  })

  it('[swatch] sees a step in yellow-green before the same RGB step in blue', () => {
    const inBlue = colourDistance({ sent: '#0000e0', shown: '#0000ff' })
    const inYellowGreen = colourDistance({ sent: '#c0e000', shown: '#c0ff00' })

    expect(inYellowGreen).toBeGreaterThan(inBlue)
  })
})
