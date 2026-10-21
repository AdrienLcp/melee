import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_GAME_SETTINGS
} from '@melee/protocol/game'

import { nextEntryAt } from './next-game'

const lineUp = [
  DEFAULT_GAME_SETTINGS.quiz,
  DEFAULT_GAME_SETTINGS.blindtest,
  DEFAULT_GAME_SETTINGS.buzzer
]

const FILM_SCORES = {
  ...DEFAULT_BLINDTEST_SETTINGS,
  source: { kind: 'film' }
} as const

const ROLLS = [0, 0.34, 0.5, 0.67, 0.99]

describe('nextEntryAt', () => {
  it('[next-game] never draws the game just played when another is ticked', () => {
    for (const roll of ROLLS) {
      expect(nextEntryAt({ lastAt: 0, lineUp, random: () => roll })).not.toBe(0)
    }
  })

  it('[next-game] draws across every other entry the line-up holds', () => {
    const drawn = new Set(
      [0, 0.99].map((roll) =>
        nextEntryAt({ lastAt: 0, lineUp, random: () => roll })
      )
    )

    expect(drawn).toEqual(new Set([1, 2]))
  })

  it('[next-game] draws another game before another entry of the same one', () => {
    const twoBlindTests = [
      DEFAULT_BLINDTEST_SETTINGS,
      FILM_SCORES,
      DEFAULT_GAME_SETTINGS.quiz
    ]

    for (const roll of ROLLS) {
      expect(
        nextEntryAt({ lastAt: 0, lineUp: twoBlindTests, random: () => roll })
      ).toBe(2)
    }
  })

  it('[next-game] draws another entry of the same game when it is all there is', () => {
    expect(
      nextEntryAt({
        lastAt: 0,
        lineUp: [DEFAULT_BLINDTEST_SETTINGS, FILM_SCORES],
        random: () => 0.5
      })
    ).toBe(1)
  })

  it('[next-game] plays the one entry again when it is the only one ticked', () => {
    expect(
      nextEntryAt({ lastAt: 0, lineUp: lineUp.slice(0, 1), random: () => 0.5 })
    ).toBe(0)
  })

  it('[next-game] draws from the whole line-up before the first round', () => {
    expect(nextEntryAt({ lastAt: null, lineUp, random: () => 0 })).toBe(0)
  })

  it('[next-game] draws nothing from an empty line-up', () => {
    expect(
      nextEntryAt({ lastAt: null, lineUp: [], random: () => 0 })
    ).toBeNull()
  })
})
