import { describe, expect, it } from 'vitest'

import { gameKinds } from '@melee/protocol/game'

import { answerModesFor, capabilitiesOf } from './game-capabilities'

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
      'move'
    ])
  })
})

describe('capabilitiesOf', () => {
  it('[game-capabilities] keeps a race out of team turns and off the wall', () => {
    for (const game of ['buzzer', 'reflex'] as const) {
      expect(capabilitiesOf(game)).toMatchObject({
        playsInTeamTurns: false,
        wallAnswers: false
      })
    }
  })

  it('[game-capabilities] lets the wall answer a round served to every screen at once', () => {
    expect(capabilitiesOf('quiz').wallAnswers).toBe(true)
    expect(capabilitiesOf('blindtest').wallAnswers).toBe(true)
  })

  it('[game-capabilities] keeps a private sheet off the wall', () => {
    expect(capabilitiesOf('slate').wallAnswers).toBe(false)
  })
})
