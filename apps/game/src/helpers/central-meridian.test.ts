import { describe, expect, it } from 'vitest'

import { centralMeridianFor } from './central-meridian'

const FIJI = 178
const SAMOA = -172
const NEW_ZEALAND = 174
const KAMCHATKA = 158

describe('the meridian a reveal is centred on', () => {
  it('[map] stays on Greenwich for a table that all landed in Europe', () => {
    expect(centralMeridianFor([2, 13, 21, -9])).toBe(0)
  })

  it('[map] stays on Greenwich for a span across Greenwich itself', () => {
    expect(centralMeridianFor([-75, 2, 120])).toBe(0)
  })

  it('[map] turns to the middle of a span across the date line', () => {
    expect(centralMeridianFor([FIJI, SAMOA])).toBe(-177)
  })

  it('[map] holds every pawn of a Pacific table in the span it centres', () => {
    expect(centralMeridianFor([SAMOA, NEW_ZEALAND, KAMCHATKA])).toBe(173)
  })

  it('[map] reads a longitude past 180° as the one it wraps to', () => {
    expect(centralMeridianFor([FIJI, SAMOA + 360])).toBe(-177)
  })

  it('[map] stays on Greenwich with nothing to frame, or one point', () => {
    expect(centralMeridianFor([])).toBe(0)
    expect(centralMeridianFor([FIJI])).toBe(0)
  })
})
