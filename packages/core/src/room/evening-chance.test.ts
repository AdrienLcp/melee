import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS } from '@melee/protocol/game'

import { eveningChance } from './evening-chance'

const { blindtest, challenge, quiz, slate } = DEFAULT_GAME_SETTINGS

describe('eveningChance', () => {
  it('[evening-chance] leaves the rounds no entry is owed to the games that serve their own', () => {
    expect(
      eveningChance({
        lineUp: [slate, challenge, quiz, blindtest],
        played: [0, 0, 0, 0],
        roundCount: 20,
        roundsOpened: 0
      })
    ).toEqual({ count: 16, fillers: ['quiz', 'blindtest'], kind: 'counted' })
  })

  it('[evening-chance] counts the rounds already opened off the evening', () => {
    expect(
      eveningChance({
        lineUp: [slate, quiz],
        played: [1, 3],
        roundCount: 10,
        roundsOpened: 4
      })
    ).toEqual({ count: 6, fillers: ['quiz'], kind: 'counted' })
  })

  it('[evening-chance] says how far a count too short for its entries must grow', () => {
    expect(
      eveningChance({
        lineUp: [slate, slate, challenge, quiz],
        played: [0, 0, 0, 0],
        roundCount: 3,
        roundsOpened: 0
      })
    ).toEqual({ excess: 1, kind: 'over', needed: 4 })
  })

  it('[evening-chance] closes an evening with no game to draw from', () => {
    expect(
      eveningChance({
        lineUp: [slate, challenge],
        played: [0, 0],
        roundCount: 20,
        roundsOpened: 0
      })
    ).toEqual({ kind: 'closed' })
  })

  it('[evening-chance] draws until the host stops when the evening has no count', () => {
    expect(
      eveningChance({
        lineUp: [challenge, quiz],
        played: [0, 0],
        roundCount: null,
        roundsOpened: 0
      })
    ).toEqual({ fillers: ['quiz'], kind: 'endless' })
  })
})
