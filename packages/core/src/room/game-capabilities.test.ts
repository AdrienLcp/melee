import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_PETIT_BAC_SETTINGS,
  DEFAULT_TIMELINE_SETTINGS,
  gameKinds
} from '@melee/protocol/game'

import {
  answerModesFor,
  capabilitiesOf,
  isEveningSilent
} from './game-capabilities'

describe('answerModesFor', () => {
  it('[game-capabilities] narrows the bare buzzer to the one mode it can serve', () => {
    expect(answerModesFor('buzzer')).toEqual(['buzzer'])
  })

  it('[game-capabilities] leaves every mode to a game that serves a stimulus', () => {
    expect(answerModesFor('blindtest')).toEqual(['buzzer', 'choice', 'typed'])
  })

  // A game offering nothing is a lobby whose start button opens a round the
  // server then refuses, which is the least legible way for this to go wrong.
  it('[game-capabilities] offers at least one mode for every game on the shelf', () => {
    for (const game of gameKinds) {
      expect(answerModesFor(game).length).toBeGreaterThan(0)
    }
  })

  it('[game-capabilities] narrows nothing before a game is picked', () => {
    expect(answerModesFor(null)).toEqual([
      'buzzer',
      'choice',
      'typed',
      'point',
      'order',
      'move',
      'spoken'
    ])
  })
})

describe('capabilitiesOf', () => {
  it('[game-capabilities] keeps a race out of duels', () => {
    for (const game of ['buzzer', 'reflex'] as const) {
      expect(capabilitiesOf(game).playsDuels).toBe(false)
    }
  })

  it('[game-capabilities] duels on a round served to every screen at once', () => {
    expect(capabilitiesOf('quiz').playsDuels).toBe(true)
    expect(capabilitiesOf('blindtest').playsDuels).toBe(true)
  })

  it('[game-capabilities] keeps a private sheet out of duels', () => {
    expect(capabilitiesOf('slate').playsDuels).toBe(false)
  })
})

describe('capabilitiesOf servesItsOwnContent', () => {
  it('[game-capabilities] leaves the content of a buzzer, a slate and a challenge to the host', () => {
    for (const game of ['buzzer', 'challenge', 'slate'] as const) {
      expect(capabilitiesOf(game).servesItsOwnContent).toBe(false)
    }
  })

  it('[game-capabilities] serves every other game from the server', () => {
    const hostBrought = new Set(['buzzer', 'challenge', 'slate'])

    for (const game of gameKinds.filter((kind) => !hostBrought.has(kind))) {
      expect(capabilitiesOf(game).servesItsOwnContent).toBe(true)
    }
  })
})

describe('isEveningSilent', () => {
  it('[game-capabilities] calls an evening of written games silent', () => {
    expect(
      isEveningSilent({
        game: DEFAULT_PETIT_BAC_SETTINGS,
        lineUp: [DEFAULT_PETIT_BAC_SETTINGS, DEFAULT_TIMELINE_SETTINGS]
      })
    ).toBe(true)
  })

  it('[game-capabilities] hears an evening with one blind test ticked anywhere in it', () => {
    expect(
      isEveningSilent({
        game: DEFAULT_PETIT_BAC_SETTINGS,
        lineUp: [DEFAULT_PETIT_BAC_SETTINGS, DEFAULT_BLINDTEST_SETTINGS]
      })
    ).toBe(false)
  })

  it('[game-capabilities] never calls an evening silent before a game is picked', () => {
    expect(isEveningSilent({ game: null, lineUp: [] })).toBe(false)
  })
})
