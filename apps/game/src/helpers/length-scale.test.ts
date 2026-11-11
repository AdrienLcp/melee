import { describe, expect, it } from 'vitest'

import { scaleForLength } from './length-scale'

describe('scaleForLength', () => {
  it('[layout] keeps a text no longer than the reference at its full size', () => {
    expect(scaleForLength({ length: 12, lengthAtFullSize: 20 })).toBe(1)
    expect(scaleForLength({ length: 20, lengthAtFullSize: 20 })).toBe(1)
  })

  it('[layout] shrinks a longer text so it covers the same area', () => {
    expect(scaleForLength({ length: 80, lengthAtFullSize: 20 })).toBe(0.5)
  })

  it('[layout] draws an empty text at full size rather than dividing by nothing', () => {
    expect(scaleForLength({ length: 0, lengthAtFullSize: 20 })).toBe(1)
  })
})
