import { describe, expect, it } from 'vitest'

import { nextGame } from './next-game'

const lineUp = ['quiz', 'blindtest', 'buzzer'] as const

describe('nextGame', () => {
  it('[next-game] never draws the game just played when another is ticked', () => {
    for (const roll of [0, 0.34, 0.5, 0.67, 0.99]) {
      expect(nextGame({ last: 'quiz', lineUp, random: () => roll })).not.toBe(
        'quiz'
      )
    }
  })

  it('[next-game] draws across every other game the line-up holds', () => {
    const drawn = new Set(
      [0, 0.99].map((roll) =>
        nextGame({ last: 'quiz', lineUp, random: () => roll })
      )
    )

    expect(drawn).toEqual(new Set(['blindtest', 'buzzer']))
  })

  it('[next-game] plays the one game again when it is the only one ticked', () => {
    expect(
      nextGame({ last: 'quiz', lineUp: ['quiz'], random: () => 0.5 })
    ).toBe('quiz')
  })

  it('[next-game] draws from the whole line-up before the first round', () => {
    expect(nextGame({ last: null, lineUp, random: () => 0 })).toBe('quiz')
  })

  it('[next-game] draws nothing from an empty line-up', () => {
    expect(nextGame({ last: null, lineUp: [], random: () => 0 })).toBeNull()
  })
})
