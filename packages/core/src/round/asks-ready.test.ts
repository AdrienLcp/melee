import { describe, expect, it } from 'vitest'

import { roomSettingsFor } from '../room/room-settings'
import { asksReady, mayAskReady } from './asks-ready'

describe('asksReady', () => {
  it('[ready] asks on every reveal but the game’s last', () => {
    expect(asksReady({ game: 'quiz', isFinal: false })).toBe(true)
    expect(asksReady({ game: 'quiz', isFinal: true })).toBe(false)
  })

  it('[ready] never asks on the slate, whose sheet is the whole game', () => {
    expect(asksReady({ game: 'slate', isFinal: false })).toBe(false)
  })
})

describe('mayAskReady', () => {
  it('[ready] never asks a table of one slate', () => {
    expect(
      mayAskReady(roomSettingsFor({ games: ['slate'], locale: 'fr' }))
    ).toBe(false)
  })

  it('[ready] asks a line-up holding a slate between its other rounds', () => {
    expect(
      mayAskReady(roomSettingsFor({ games: ['slate', 'quiz'], locale: 'fr' }))
    ).toBe(true)
  })

  it('[ready] asks a table still deciding what it plays', () => {
    expect(mayAskReady(roomSettingsFor({ games: [], locale: 'fr' }))).toBe(true)
  })
})
