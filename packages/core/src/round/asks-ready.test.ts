import { describe, expect, it } from 'vitest'

import { asksReady } from './asks-ready'

describe('asksReady', () => {
  it('[ready] asks on every reveal but the game’s last', () => {
    expect(asksReady({ game: 'quiz', isFinal: false })).toBe(true)
    expect(asksReady({ game: 'quiz', isFinal: true })).toBe(false)
  })

  it('[ready] never asks on the slate, whose sheet is the whole game', () => {
    expect(asksReady({ game: 'slate', isFinal: false })).toBe(false)
  })
})
