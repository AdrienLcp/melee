import { describe, expect, it } from 'vitest'

import type { GameKind } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { fittedToAloud, lineUpHolds, toggledInLineUp } from './line-up'
import { type GameSetup, roomSettingsFor } from './room-settings'

const neverPlayed = (_game: GameKind): GameSetup | null => null

const toggle = (settings: RoomSettings, game: GameKind): RoomSettings =>
  toggledInLineUp({ game, locale: 'fr', rememberedFor: neverPlayed, settings })

const onNothing = roomSettingsFor({ game: null, locale: 'fr' })
const onTheQuiz = roomSettingsFor({ game: 'quiz', locale: 'fr' })

describe('lineUpHolds', () => {
  it('[line-up] holds for every room a door opens', () => {
    expect(lineUpHolds(onNothing)).toBe(true)
    expect(lineUpHolds(onTheQuiz)).toBe(true)
  })

  it('[line-up] refuses a game that is not ticked', () => {
    expect(lineUpHolds({ ...onTheQuiz, lineUp: ['blindtest'] })).toBe(false)
  })

  it('[line-up] refuses ticks in a room still deciding', () => {
    expect(lineUpHolds({ ...onNothing, lineUp: ['quiz'] })).toBe(false)
  })

  it('[line-up] refuses a game a table answering aloud cannot play', () => {
    const aloud = { ...onTheQuiz, teams: { count: 2, kind: 'aloud' } } as const

    expect(lineUpHolds({ ...aloud, lineUp: ['quiz', 'buzzer'] })).toBe(true)
    expect(lineUpHolds({ ...aloud, lineUp: ['quiz', 'worldmap'] })).toBe(false)
    expect(lineUpHolds({ ...aloud, lineUp: ['quiz', 'reflex'] })).toBe(false)
    expect(lineUpHolds({ ...aloud, lineUp: ['quiz', 'slate'] })).toBe(false)
  })
})

describe('toggledInLineUp', () => {
  it('[line-up] picks the game with the first tick of a room still deciding', () => {
    const ticked = toggle(onNothing, 'slate')

    expect(ticked.game?.kind).toBe('slate')
    expect(ticked.lineUp).toEqual(['slate'])
    expect(ticked.mode.kind).toBe('typed')
  })

  it('[line-up] adds a game beside the one the next round is on', () => {
    const ticked = toggle(onTheQuiz, 'buzzer')

    expect(ticked.game?.kind).toBe('quiz')
    expect(ticked.lineUp).toEqual(['quiz', 'buzzer'])
  })

  it('[line-up] moves the room to a game still ticked when its own is taken out', () => {
    const untucked = toggle(toggle(onTheQuiz, 'buzzer'), 'quiz')

    expect(untucked.game?.kind).toBe('buzzer')
    expect(untucked.lineUp).toEqual(['buzzer'])
    expect(untucked.mode.kind).toBe('buzzer')
    expect(lineUpHolds(untucked)).toBe(true)
  })

  it('[line-up] keeps the last tick: a room that picked a game does not go back to deciding', () => {
    expect(toggle(onTheQuiz, 'quiz')).toBe(onTheQuiz)
  })

  it('[line-up] keeps the evening’s length when a game joins it', () => {
    const evening = toggle({ ...onTheQuiz, roundCount: 12 }, 'buzzer')

    expect(evening.roundCount).toBe(12)
  })
})

describe('fittedToAloud', () => {
  const aloud = (settings: RoomSettings): RoomSettings =>
    fittedToAloud({
      locale: 'fr',
      rememberedFor: neverPlayed,
      settings: { ...settings, teams: { count: 2, kind: 'aloud' } }
    })

  it('[line-up] takes out the games a table answering aloud cannot play', () => {
    const evening = toggle(toggle(onTheQuiz, 'worldmap'), 'buzzer')
    const fitted = aloud(evening)

    expect(fitted.lineUp).toEqual(['quiz', 'buzzer'])
    expect(lineUpHolds(fitted)).toBe(true)
  })

  it('[line-up] moves the next round off a game that cannot be played aloud', () => {
    const onTheMap = toggle(toggle(onNothing, 'worldmap'), 'blindtest')
    const fitted = aloud(onTheMap)

    expect(fitted.game?.kind).toBe('blindtest')
    expect(fitted.lineUp).toEqual(['blindtest'])
  })

  it('[line-up] falls back to the quiz when no game ticked can be played aloud', () => {
    const fitted = aloud(toggle(onNothing, 'reflex'))

    expect(fitted.game?.kind).toBe('quiz')
    expect(fitted.lineUp).toEqual(['quiz'])
  })

  it('[line-up] leaves a room still deciding as it is', () => {
    expect(aloud(onNothing).game).toBeNull()
  })
})
