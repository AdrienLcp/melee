import { describe, expect, it } from 'vitest'

import type { GameKind } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { lineUpHolds, toggledInLineUp } from './line-up'
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
