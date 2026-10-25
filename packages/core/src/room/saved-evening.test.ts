import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_GAME_SETTINGS,
  type GameKind
} from '@melee/protocol/game'

import { lineUpHolds } from './line-up'
import { type GameSetup, openedSetup, roomSettingsFor } from './room-settings'
import {
  SAVED_EVENINGS_MAX,
  type SavedEvening,
  savedEveningOf,
  withEveningSaved,
  withoutEvening,
  withSavedEvening
} from './saved-evening'

const neverPlayed = (_game: GameKind): GameSetup | null => null

const onNothing = roomSettingsFor({ games: [], locale: 'fr' })

const FILM_SCORES = {
  ...DEFAULT_BLINDTEST_SETTINGS,
  source: { kind: 'film' }
} as const

const gameNight: SavedEvening = {
  lineUp: [
    DEFAULT_GAME_SETTINGS.quiz,
    FILM_SCORES,
    DEFAULT_GAME_SETTINGS.timeline
  ],
  name: 'Game night',
  roundCount: 20,
  runningOrder: [1, 0, 2, 0]
}

const load = (evening: SavedEvening) =>
  withSavedEvening({
    evening,
    locale: 'fr',
    rememberedFor: neverPlayed,
    settings: onNothing
  })

describe('withSavedEvening', () => {
  it('[saved-evening] runs the evening on its own entries, count and order', () => {
    const loaded = load(gameNight)

    expect(loaded.lineUp).toEqual(gameNight.lineUp)
    expect(loaded.roundCount).toBe(20)
    expect(loaded.runningOrder).toEqual([1, 0, 2, 0])
    expect(loaded.lineUpAt).toBe(1)
    expect(loaded.game).toEqual(FILM_SCORES)
    expect(lineUpHolds(loaded)).toBe(true)
  })

  it('[saved-evening] opens an entry whose settings were lost on what its game was last left at', () => {
    const remembered = {
      ...openedSetup({ game: 'timeline', locale: 'fr' }),
      game: { kind: 'timeline', roundDurationMs: 60_000 }
    } satisfies GameSetup
    const loaded = withSavedEvening({
      evening: { ...gameNight, lineUp: ['quiz', FILM_SCORES, 'timeline'] },
      locale: 'fr',
      rememberedFor: (game) => (game === 'timeline' ? remembered : null),
      settings: onNothing
    })

    expect(loaded.lineUp[0]).toEqual(
      openedSetup({ game: 'quiz', locale: 'fr' }).game
    )
    expect(loaded.lineUp[2]).toEqual(remembered.game)
  })

  it('[saved-evening] has the room deal again when the order no longer points into the line-up', () => {
    const loaded = load({ ...gameNight, runningOrder: [0, 5] })

    expect(loaded.runningOrder).toEqual([])
    expect(loaded.lineUpAt).toBe(0)
    expect(lineUpHolds(loaded)).toBe(true)
  })

  it('[saved-evening] leaves the room as it was for an evening with nothing in it', () => {
    expect(load({ ...gameNight, lineUp: [] })).toBe(onNothing)
  })
})

describe('withEveningSaved', () => {
  const evening = savedEveningOf({
    name: '  Game night ',
    settings: load(gameNight)
  })

  it('[saved-evening] keeps a new evening first and replaces one of the same name', () => {
    const other = { ...evening, name: 'Christmas' }
    const saved = withEveningSaved({ evening: other, evenings: [evening] })

    expect(saved.map(({ name }) => name)).toEqual(['Christmas', 'Game night'])

    const updated = withEveningSaved({
      evening: { ...evening, name: 'game NIGHT', roundCount: 5 },
      evenings: saved
    })

    expect(updated.map(({ roundCount }) => roundCount)).toEqual([20, 5])
  })

  it('[saved-evening] lets the oldest go past the most a host keeps', () => {
    const many = Array.from({ length: SAVED_EVENINGS_MAX }, (_, index) => ({
      ...evening,
      name: `Evening ${index}`
    }))
    const saved = withEveningSaved({ evening, evenings: many })

    expect(saved).toHaveLength(SAVED_EVENINGS_MAX)
    expect(saved[0]).toBe(evening)
    expect(saved.at(-1)?.name).toBe(`Evening ${SAVED_EVENINGS_MAX - 2}`)
  })

  it('[saved-evening] forgets an evening by its name', () => {
    expect(withoutEvening({ evenings: [evening], name: 'game night' })).toEqual(
      []
    )
  })
})
