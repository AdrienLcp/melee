import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_GAME_SETTINGS,
  type GameSettings
} from '@melee/protocol/game'

import { hasEntryLeftToDeal, nextEntryAt, playedPerEntry } from './next-game'

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

/** A line-up nothing has been played from, on an evening the host ends. */
const fresh = (entries: readonly GameSettings[]) => ({
  lineUp: entries,
  played: entries.map(() => 0),
  roundsLeft: null
})

describe('nextEntryAt', () => {
  it('[next-game] never draws the game just played when another is ticked', () => {
    for (const roll of ROLLS) {
      expect(
        nextEntryAt({ ...fresh(lineUp), lastAt: 0, random: () => roll })
      ).not.toBe(0)
    }
  })

  it('[next-game] draws across every other entry the line-up holds', () => {
    const drawn = new Set(
      [0, 0.99].map((roll) =>
        nextEntryAt({ ...fresh(lineUp), lastAt: 0, random: () => roll })
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
        nextEntryAt({
          ...fresh(twoBlindTests),
          lastAt: 0,
          random: () => roll
        })
      ).toBe(2)
    }
  })

  it('[next-game] draws another entry of the same game when it is all there is', () => {
    expect(
      nextEntryAt({
        ...fresh([DEFAULT_BLINDTEST_SETTINGS, FILM_SCORES]),
        lastAt: 0,
        random: () => 0.5
      })
    ).toBe(1)
  })

  it('[next-game] plays the one entry again when it is the only one ticked', () => {
    expect(
      nextEntryAt({
        ...fresh(lineUp.slice(0, 1)),
        lastAt: 0,
        random: () => 0.5
      })
    ).toBe(0)
  })

  it('[next-game] draws from the whole line-up before the first round', () => {
    expect(
      nextEntryAt({ ...fresh(lineUp), lastAt: null, random: () => 0 })
    ).toBe(0)
  })

  it('[next-game] draws nothing from an empty line-up', () => {
    expect(
      nextEntryAt({ ...fresh([]), lastAt: null, random: () => 0 })
    ).toBeNull()
  })

  it('[next-game] draws an entry not yet played before one played already', () => {
    const quizzes = [DEFAULT_GAME_SETTINGS.quiz, DEFAULT_GAME_SETTINGS.quiz]
    const evening = [...quizzes, DEFAULT_GAME_SETTINGS.timeline]

    for (const roll of ROLLS) {
      expect(
        nextEntryAt({
          lastAt: 2,
          lineUp: evening,
          played: [1, 0, 1],
          random: () => roll,
          roundsLeft: null
        })
      ).toBe(1)
    }
  })

  it('[next-game] plays a host-brought entry once and never again', () => {
    for (const roll of ROLLS) {
      expect(
        nextEntryAt({
          lastAt: 0,
          lineUp,
          played: [1, 1, 1],
          random: () => roll,
          roundsLeft: null
        })
      ).toBe(1)
    }
  })

  it('[next-game] draws nothing once every host-brought entry is played', () => {
    expect(
      nextEntryAt({
        lastAt: 0,
        lineUp: [DEFAULT_GAME_SETTINGS.buzzer, DEFAULT_GAME_SETTINGS.slate],
        played: [1, 1],
        random: () => 0.5,
        roundsLeft: 3
      })
    ).toBeNull()
  })

  it('[next-game] draws another game before an entry still owed of the one just played', () => {
    for (const roll of ROLLS) {
      expect(
        nextEntryAt({
          lastAt: 0,
          lineUp: [
            DEFAULT_BLINDTEST_SETTINGS,
            FILM_SCORES,
            DEFAULT_GAME_SETTINGS.quiz
          ],
          played: [1, 0, 1],
          random: () => roll,
          roundsLeft: 5
        })
      ).toBe(2)
    }
  })

  it('[next-game] spends the last rounds on the entries still owed, whatever was just played', () => {
    for (const roll of ROLLS) {
      expect(
        nextEntryAt({
          lastAt: 0,
          lineUp: [
            DEFAULT_BLINDTEST_SETTINGS,
            FILM_SCORES,
            DEFAULT_GAME_SETTINGS.quiz
          ],
          played: [1, 0, 1],
          random: () => roll,
          roundsLeft: 1
        })
      ).toBe(1)
    }
  })

  it('[next-game] plays every entry of a counted evening at least once', () => {
    const evening = [
      DEFAULT_BLINDTEST_SETTINGS,
      FILM_SCORES,
      DEFAULT_GAME_SETTINGS.quiz,
      DEFAULT_GAME_SETTINGS.slate,
      DEFAULT_GAME_SETTINGS.challenge
    ]
    const roundCount = 8

    for (const roll of ROLLS) {
      const played = evening.map(() => 0)
      let lastAt: number | null = null

      for (let round = 0; round < roundCount; round += 1) {
        const at = nextEntryAt({
          lastAt,
          lineUp: evening,
          played,
          random: () => roll,
          roundsLeft: roundCount - round
        })

        expect(at).not.toBeNull()
        played[at ?? 0] = (played[at ?? 0] ?? 0) + 1
        lastAt = at
      }

      expect(played.every((times) => times >= 1)).toBe(true)
      expect(played[3]).toBe(1)
      expect(played[4]).toBe(1)
    }
  })
})

describe('playedPerEntry', () => {
  it('[next-game] counts each round towards the entry it opened on', () => {
    expect(
      playedPerEntry({
        lineUp,
        opened: [lineUp[1], lineUp[0], lineUp[1]].filter(
          (entry) => entry !== undefined
        )
      })
    ).toEqual([1, 2, 0])
  })

  it('[next-game] spreads rounds across two identical entries', () => {
    expect(
      playedPerEntry({
        lineUp: [DEFAULT_GAME_SETTINGS.slate, DEFAULT_GAME_SETTINGS.slate],
        opened: [DEFAULT_GAME_SETTINGS.slate]
      })
    ).toEqual([1, 0])
  })

  it('[next-game] counts nothing towards an entry changed since it was played', () => {
    expect(
      playedPerEntry({
        lineUp: [FILM_SCORES],
        opened: [DEFAULT_BLINDTEST_SETTINGS]
      })
    ).toEqual([0])
  })
})

describe('hasEntryLeftToDeal', () => {
  const hostBrought = [
    DEFAULT_GAME_SETTINGS.buzzer,
    DEFAULT_GAME_SETTINGS.slate
  ]

  it('[next-game] ends an evening whose every entry was the host’s and is played', () => {
    expect(hasEntryLeftToDeal({ lineUp: hostBrought, played: [1, 1] })).toBe(
      false
    )
  })

  it('[next-game] keeps an evening going while a host-brought entry is owed', () => {
    expect(hasEntryLeftToDeal({ lineUp: hostBrought, played: [1, 0] })).toBe(
      true
    )
  })

  it('[next-game] keeps a room of one game playing on', () => {
    expect(
      hasEntryLeftToDeal({ lineUp: hostBrought.slice(0, 1), played: [3] })
    ).toBe(true)
  })
})
