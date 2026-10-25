import { describe, expect, it } from 'vitest'

import type { GameKind } from '@melee/protocol/game'
import {
  type AnswerMode,
  DEFAULT_MODE_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'

import { answerModesFor } from './game-capabilities'
import {
  isJudgedByHost,
  isJudgedInEveryMode,
  isRoundJudgedByHost,
  modeOfferedBy,
  offersAnswerMode,
  seatWithheldReason
} from './game-modes'
import { roomSettingsFor } from './room-settings'

const settingsPlaying = ({
  game,
  mode
}: {
  game: GameKind
  mode: AnswerMode
}): RoomSettings => ({
  ...roomSettingsFor({ games: [game], locale: 'en' }),
  mode: DEFAULT_MODE_SETTINGS[mode]
})

describe('offersAnswerMode', () => {
  it('[game-modes] refuses a typed field to a game with nothing to type against', () => {
    expect(offersAnswerMode({ game: 'buzzer', mode: 'typed' })).toBe(false)
    expect(offersAnswerMode({ game: 'buzzer', mode: 'buzzer' })).toBe(true)
  })
})

describe('isJudgedByHost', () => {
  it('[game-modes] leaves the reflex race to settle on its own presses', () => {
    expect(isJudgedByHost({ game: 'reflex', mode: 'buzzer' })).toBe(false)
  })

  it('[game-modes] leaves the inner clock to settle on its counts', () => {
    expect(isJudgedByHost({ game: 'innerclock', mode: 'buzzer' })).toBe(false)
  })

  it('[game-modes] keeps a bare buzzer’s host reading the answer', () => {
    expect(isJudgedByHost({ game: 'buzzer', mode: 'buzzer' })).toBe(true)
  })

  // The mode is what asks for a judge, so the same game answers differently
  // depending on how the room decided to answer it.
  it('[game-modes] asks for no judge where the server grades', () => {
    expect(isJudgedByHost({ game: 'blindtest', mode: 'typed' })).toBe(false)
    expect(isJudgedByHost({ game: 'blindtest', mode: 'buzzer' })).toBe(true)
  })

  // The slate is typed and still marked by hand: the host holds the key, so a
  // seat for them is a sheet filled in from the answers.
  it('[game-modes] keeps the slate’s host marking the sheets under its typed mode', () => {
    expect(answerModesFor('slate')).toEqual(['typed'])
    expect(isJudgedByHost({ game: 'slate', mode: 'typed' })).toBe(true)
  })

  it('[game-modes] withholds the seat from a room that has picked nothing yet', () => {
    expect(isJudgedByHost({ game: null, mode: 'buzzer' })).toBe(true)
  })

  // The quiz is the other game offering all three, and the one whose host is
  // most likely to be surprised: nothing about a bank of questions says a room
  // playing it might owe a verdict.
  it('[game-modes] judges a quiz answered by a buzz and no other quiz', () => {
    expect(isJudgedByHost({ game: 'quiz', mode: 'buzzer' })).toBe(true)
    expect(isJudgedByHost({ game: 'quiz', mode: 'choice' })).toBe(false)
    expect(isJudgedByHost({ game: 'quiz', mode: 'typed' })).toBe(false)
  })

  it('[game-modes] judges a matchstick said aloud and not one moved on a screen', () => {
    expect(isJudgedByHost({ game: 'matchsticks', mode: 'buzzer' })).toBe(true)
    expect(isJudgedByHost({ game: 'matchsticks', mode: 'move' })).toBe(false)
  })
})

describe('isJudgedInEveryMode', () => {
  it('[game-modes] marks the games judged however they are answered', () => {
    expect(isJudgedInEveryMode('buzzer')).toBe(true)
    expect(isJudgedInEveryMode('challenge')).toBe(true)
    expect(isJudgedInEveryMode('slate')).toBe(true)
  })

  it('[game-modes] leaves out a game that merely offers a judged mode', () => {
    expect(isJudgedInEveryMode('quiz')).toBe(false)
    expect(isJudgedInEveryMode('matchsticks')).toBe(false)
    expect(isJudgedInEveryMode('reflex')).toBe(false)
  })
})

describe('seatWithheldReason', () => {
  it('[game-modes] withholds nothing for a game or a mode the console judges', () => {
    expect(
      seatWithheldReason(settingsPlaying({ game: 'quiz', mode: 'buzzer' }))
    ).toBeNull()
    expect(
      seatWithheldReason(settingsPlaying({ game: 'slate', mode: 'typed' }))
    ).toBeNull()
  })

  it('[game-modes] names the aloud teams', () => {
    const quizTyped = settingsPlaying({ game: 'quiz', mode: 'typed' })

    expect(
      seatWithheldReason({ ...quizTyped, teams: { count: 2, kind: 'aloud' } })
    ).toBe('aloud')
  })

  it('[game-modes] says nothing where the console may sit, or no game is picked', () => {
    expect(
      seatWithheldReason(settingsPlaying({ game: 'quiz', mode: 'typed' }))
    ).toBeNull()
    expect(
      seatWithheldReason(settingsPlaying({ game: 'reflex', mode: 'buzzer' }))
    ).toBeNull()
    expect(
      seatWithheldReason(roomSettingsFor({ games: [], locale: 'en' }))
    ).toBeNull()
  })
})

describe('modeOfferedBy', () => {
  it('[game-modes] serves the preference a game offers', () => {
    expect(
      modeOfferedBy({ game: 'quiz', preferred: DEFAULT_MODE_SETTINGS.typed })
    ).toEqual({ kind: 'typed' })
  })

  it('[game-modes] falls back to the only mode a bare buzzer offers', () => {
    expect(
      modeOfferedBy({ game: 'buzzer', preferred: DEFAULT_MODE_SETTINGS.typed })
    ).toEqual({ answerWindowMs: 10_000, kind: 'buzzer' })
  })

  // The kind is what a game gets a say in; the floor a host set to "you decide"
  // is theirs, and comes through with it.
  it('[game-modes] carries a served mode’s own settings through untouched', () => {
    expect(
      modeOfferedBy({
        game: 'blindtest',
        preferred: { answerWindowMs: null, kind: 'buzzer' }
      })
    ).toEqual({ answerWindowMs: null, kind: 'buzzer' })
  })
})

describe('isRoundJudgedByHost', () => {
  it('[game-modes] reads the round on screen, never the settings that follow it', () => {
    expect(
      isRoundJudgedByHost({ answerMode: 'buzzer', content: { kind: 'quiz' } })
    ).toBe(true)
    expect(
      isRoundJudgedByHost({ answerMode: 'typed', content: { kind: 'slate' } })
    ).toBe(true)
    expect(
      isRoundJudgedByHost({ answerMode: 'typed', content: { kind: 'quiz' } })
    ).toBe(false)
    expect(
      isRoundJudgedByHost({ answerMode: 'buzzer', content: { kind: 'reflex' } })
    ).toBe(false)
    expect(isRoundJudgedByHost(null)).toBe(false)
  })
})
