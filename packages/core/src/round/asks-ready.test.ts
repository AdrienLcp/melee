import { describe, expect, it } from 'vitest'

import { asksReady } from './asks-ready'

describe('asksReady', () => {
  it('[ready] asks on every round of a counted game but the last', () => {
    expect(asksReady({ game: 'quiz', roundCount: 12, roundIndex: 11 })).toBe(
      true
    )
    expect(asksReady({ game: 'quiz', roundCount: 12, roundIndex: 12 })).toBe(
      false
    )
  })

  it('[ready] asks on every round of a game played until the host ends it', () => {
    expect(
      asksReady({ game: 'blindtest', roundCount: null, roundIndex: 40 })
    ).toBe(true)
  })

  it('[ready] never asks on the slate, whose sheet is the whole game', () => {
    expect(asksReady({ game: 'slate', roundCount: null, roundIndex: 1 })).toBe(
      false
    )
  })
})
