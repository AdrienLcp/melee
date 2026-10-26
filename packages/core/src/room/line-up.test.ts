import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_BUZZER_SETTINGS,
  DEFAULT_GAME_SETTINGS,
  type GameKind
} from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import {
  fittedToAloud,
  followedByLineUp,
  lineUpHolds,
  toggledInLineUp,
  withEntryAdded,
  withoutEntry
} from './line-up'
import { type GameSetup, roomSettingsFor } from './room-settings'

const neverPlayed = (_game: GameKind): GameSetup | null => null

const toggle = (settings: RoomSettings, game: GameKind): RoomSettings =>
  toggledInLineUp({ game, locale: 'fr', rememberedFor: neverPlayed, settings })

const onNothing = roomSettingsFor({ games: [], locale: 'fr' })
const onTheQuiz = roomSettingsFor({ games: ['quiz'], locale: 'fr' })
const onTheCharts = roomSettingsFor({ games: ['blindtest'], locale: 'fr' })

const entries = (...games: GameKind[]) =>
  games.map((game) => DEFAULT_GAME_SETTINGS[game])

const kinds = (settings: RoomSettings): GameKind[] =>
  settings.lineUp.map((entry) => entry.kind)

const FILM_SCORES = {
  ...DEFAULT_BLINDTEST_SETTINGS,
  source: { kind: 'film' }
} as const

describe('lineUpHolds', () => {
  it('[line-up] holds for every room a door opens', () => {
    expect(lineUpHolds(onNothing)).toBe(true)
    expect(lineUpHolds(onTheQuiz)).toBe(true)
  })

  it('[line-up] refuses a game that is not the entry it points at', () => {
    expect(lineUpHolds({ ...onTheQuiz, lineUp: entries('blindtest') })).toBe(
      false
    )
    expect(
      lineUpHolds({ ...onTheQuiz, lineUp: entries('blindtest', 'quiz') })
    ).toBe(false)
    expect(lineUpHolds({ ...onTheQuiz, lineUpAt: 1 })).toBe(false)
  })

  it('[line-up] refuses ticks in a room still deciding', () => {
    expect(lineUpHolds({ ...onNothing, lineUp: entries('quiz') })).toBe(false)
    expect(lineUpHolds({ ...onNothing, lineUpAt: 0 })).toBe(false)
  })

  it('[line-up] holds two entries of one game on different settings', () => {
    expect(
      lineUpHolds({
        ...onTheCharts,
        lineUp: [DEFAULT_BLINDTEST_SETTINGS, FILM_SCORES]
      })
    ).toBe(true)
  })

  it('[line-up] refuses a game a table answering aloud cannot play', () => {
    const aloud = { ...onTheQuiz, teams: { count: 2, kind: 'aloud' } } as const

    expect(lineUpHolds({ ...aloud, lineUp: entries('quiz', 'buzzer') })).toBe(
      true
    )
    expect(lineUpHolds({ ...aloud, lineUp: entries('quiz', 'atlas') })).toBe(
      false
    )
    expect(lineUpHolds({ ...aloud, lineUp: entries('quiz', 'reflex') })).toBe(
      false
    )
    expect(lineUpHolds({ ...aloud, lineUp: entries('quiz', 'slate') })).toBe(
      false
    )
  })
})

describe('toggledInLineUp', () => {
  it('[line-up] picks the game with the first tick of a room still deciding', () => {
    const ticked = toggle(onNothing, 'slate')

    expect(ticked.game?.kind).toBe('slate')
    expect(kinds(ticked)).toEqual(['slate'])
    expect(ticked.mode.kind).toBe('typed')
  })

  it('[line-up] adds a game beside the one the next round is on', () => {
    const ticked = toggle(onTheQuiz, 'buzzer')

    expect(ticked.game?.kind).toBe('quiz')
    expect(kinds(ticked)).toEqual(['quiz', 'buzzer'])
  })

  it('[line-up] moves the room to a game still ticked when its own is taken out', () => {
    const untucked = toggle(toggle(onTheQuiz, 'buzzer'), 'quiz')

    expect(untucked.game?.kind).toBe('buzzer')
    expect(kinds(untucked)).toEqual(['buzzer'])
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

  it('[line-up] takes out every entry of a game at once', () => {
    const evening = toggle(
      withEntryAdded({
        game: 'blindtest',
        locale: 'fr',
        remembered: null,
        settings: toggle(onTheCharts, 'quiz')
      }),
      'blindtest'
    )

    expect(kinds(evening)).toEqual(['quiz'])
    expect(evening.game?.kind).toBe('quiz')
    expect(lineUpHolds(evening)).toBe(true)
  })

  it('[line-up] ticks a game on what this host last left it set to', () => {
    const ticked = toggledInLineUp({
      game: 'blindtest',
      locale: 'fr',
      rememberedFor: (game) =>
        game === 'blindtest'
          ? {
              autoAdvanceMs: null,
              game: FILM_SCORES,
              mode: { kind: 'choice' },
              roundCount: 10
            }
          : null,
      settings: onTheQuiz
    })

    expect(ticked.lineUp[1]).toEqual(FILM_SCORES)
  })
})

describe('variants', () => {
  const onTheChartsTwice = withEntryAdded({
    game: 'blindtest',
    locale: 'fr',
    remembered: null,
    settings: onTheCharts
  })

  it('[line-up] adds a round at the end without making it the next one', () => {
    const evening = withEntryAdded({
      game: 'blindtest',
      locale: 'fr',
      remembered: null,
      settings: toggle(onTheCharts, 'quiz')
    })

    expect(kinds(evening)).toEqual(['blindtest', 'quiz', 'blindtest'])
    expect(evening.lineUpAt).toBe(0)
    expect(lineUpHolds(evening)).toBe(true)
  })

  it('[line-up] picks the game when the room is still deciding', () => {
    const picked = withEntryAdded({
      game: 'slate',
      locale: 'fr',
      remembered: null,
      settings: onNothing
    })

    expect(kinds(picked)).toEqual(['slate'])
    expect(picked.game?.kind).toBe('slate')
    expect(picked.lineUpAt).toBe(0)
  })

  it('[line-up] writes the game back into the entry it was opened from', () => {
    const followed = followedByLineUp({
      ...onTheChartsTwice,
      game: FILM_SCORES,
      lineUpAt: 1
    })

    expect(followed.lineUp).toEqual([onTheCharts.game, FILM_SCORES])
  })

  it('[line-up] moves off an entry taken out to the one after it, on its own settings', () => {
    const evening = followedByLineUp({
      ...onTheChartsTwice,
      game: FILM_SCORES,
      lineUpAt: 1
    })
    const firstOut = withoutEntry({
      at: 0,
      locale: 'fr',
      rememberedFor: neverPlayed,
      settings: { ...evening, game: onTheCharts.game, lineUpAt: 0 }
    })

    expect(firstOut.lineUp).toEqual([FILM_SCORES])
    expect(firstOut.game).toEqual(FILM_SCORES)
    expect(firstOut.lineUpAt).toBe(0)
  })

  it('[line-up] keeps pointing at the same entry when another is taken out', () => {
    const evening = toggle(
      {
        ...onTheQuiz,
        game: DEFAULT_BUZZER_SETTINGS,
        lineUp: entries('quiz', 'buzzer'),
        lineUpAt: 1
      },
      'slate'
    )
    const without = withoutEntry({
      at: 0,
      locale: 'fr',
      rememberedFor: neverPlayed,
      settings: evening
    })

    expect(kinds(without)).toEqual(['buzzer', 'slate'])
    expect(without.lineUpAt).toBe(0)
    expect(without.game?.kind).toBe('buzzer')
  })

  it('[line-up] keeps the last entry', () => {
    expect(
      withoutEntry({
        at: 0,
        locale: 'fr',
        rememberedFor: neverPlayed,
        settings: onTheQuiz
      })
    ).toBe(onTheQuiz)
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
    const evening = toggle(toggle(onTheQuiz, 'atlas'), 'buzzer')
    const fitted = aloud(evening)

    expect(kinds(fitted)).toEqual(['quiz', 'buzzer'])
    expect(lineUpHolds(fitted)).toBe(true)
  })

  it('[line-up] moves the next round off a game that cannot be played aloud', () => {
    const onTheMap = toggle(toggle(onNothing, 'atlas'), 'blindtest')
    const fitted = aloud(onTheMap)

    expect(fitted.game?.kind).toBe('blindtest')
    expect(kinds(fitted)).toEqual(['blindtest'])
  })

  it('[line-up] falls back to the quiz when no game ticked can be played aloud', () => {
    const fitted = aloud(toggle(onNothing, 'reflex'))

    expect(fitted.game?.kind).toBe('quiz')
    expect(kinds(fitted)).toEqual(['quiz'])
  })

  it('[line-up] leaves a room still deciding as it is', () => {
    expect(aloud(onNothing).game).toBeNull()
  })
})

describe('the running order across line-up edits', () => {
  const inOrder = (order: RoomSettings['runningOrder']): RoomSettings => ({
    ...roomSettingsFor({
      games: ['quiz', 'challenge', 'blindtest'],
      locale: 'fr'
    }),
    runningOrder: order
  })

  it('[running-order] refuses a row pointing past the line-up', () => {
    expect(lineUpHolds(inOrder([0, 3]))).toBe(false)
    expect(lineUpHolds(inOrder([2, null, 0]))).toBe(true)
  })

  it('[running-order] refuses an order in a room still deciding', () => {
    expect(lineUpHolds({ ...onNothing, runningOrder: [0] })).toBe(false)
  })

  it('[running-order] plays a round added to an ordered evening last', () => {
    const added = withEntryAdded({
      game: 'slate',
      locale: 'fr',
      remembered: null,
      settings: inOrder([1, null, 0, 2])
    })

    expect(added.runningOrder).toEqual([1, null, 0, 2, 3])
  })

  it('[running-order] leaves the rows of an entry taken out to chance', () => {
    const taken = withoutEntry({
      at: 1,
      locale: 'fr',
      rememberedFor: neverPlayed,
      settings: inOrder([1, null, 0, 2])
    })

    expect(taken.runningOrder).toEqual([null, null, 0, 1])
  })
})
