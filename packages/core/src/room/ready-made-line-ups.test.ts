import { describe, expect, it } from 'vitest'

import { DEFAULT_GAME_SETTINGS, gameSettingsSchema } from '@melee/protocol/game'
import { DEFAULT_ROOM_SETTINGS } from '@melee/protocol/room'

import { isJudgedByHost, modeOfferedBy } from './game-modes'
import { lineUpHolds, withNothingPlanned } from './line-up'
import {
  gameOfEntry,
  gamesOfLineUp,
  isOnReadyMade,
  type ReadyMadeLineUp,
  readyMadeLineUpIds,
  readyMadeLineUpsFor,
  savedEveningOfReadyMade
} from './ready-made-line-ups'
import { openedSetup, ROUND_COUNT_STEPS } from './room-settings'
import { withSavedEvening } from './saved-evening'

describe.each(['fr', 'en'] as const)('ready-made line-ups in %s', (locale) => {
  const lineUps = readyMadeLineUpsFor(locale)

  it('[ready-made] ships one of each id, in the order they are listed', () => {
    expect(lineUps.map(({ id }) => id)).toEqual([...readyMadeLineUpIds])
  })

  it.each(lineUps)(
    '[ready-made] $id spells every variant in a shape the wire accepts',
    ({ lineUp }) => {
      for (const entry of lineUp) {
        if (typeof entry !== 'string') {
          expect(gameSettingsSchema.safeParse(entry).success).toBe(true)
        }
      }
    }
  )

  it.each(lineUps)(
    '[ready-made] $id opens on games a room may be opened for, at a round count the strip offers',
    (lineUp) => {
      expect(gamesOfLineUp(lineUp).length).toBeGreaterThan(0)
      expect(ROUND_COUNT_STEPS).toContain(lineUp.roundCount)
    }
  )

  it.each(lineUps)(
    '[ready-made] $id loads every entry and its length into a room',
    (lineUp) => {
      const settings = withSavedEvening({
        evening: savedEveningOfReadyMade({ lineUp, name: lineUp.id }),
        locale,
        rememberedFor: () => null,
        settings: DEFAULT_ROOM_SETTINGS
      })

      expect(settings.lineUp).toHaveLength(lineUp.lineUp.length)
      expect(settings.roundCount).toBe(lineUp.roundCount)
      expect(settings.game).not.toBeNull()
    }
  )
})

describe.each(['fr', 'en'] as const)('the grand mix in %s', (locale) => {
  const grandMix = readyMadeLineUpsFor(locale).find(
    ({ id }) => id === 'grandMix'
  )

  if (grandMix === undefined) {
    throw new Error('the grand mix ships')
  }

  it('[ready-made] plays no entry a host has to judge, on the mode each opens on', () => {
    for (const entry of grandMix.lineUp) {
      const game = gameOfEntry(entry)
      const settings =
        typeof entry === 'string' ? DEFAULT_GAME_SETTINGS[entry] : entry
      const mode = modeOfferedBy({
        game: settings,
        preferred: openedSetup({ game, locale }).mode
      })

      expect(isJudgedByHost({ game, mode: mode.kind })).toBe(false)
    }
  })

  it('[ready-made] plans every entry once inside its round count', () => {
    expect(grandMix.lineUp.length).toBeLessThanOrEqual(grandMix.roundCount ?? 0)
    expect(grandMix.runningOrder).toHaveLength(grandMix.lineUp.length)
    expect(new Set(grandMix.runningOrder)).toEqual(
      new Set(grandMix.lineUp.map((_, at) => at))
    )
  })
})

it('[ready-made] asks the quiz in the language the table speaks', () => {
  const quizLanguages = (locale: 'en' | 'fr') =>
    readyMadeLineUpsFor(locale)
      .flatMap(({ lineUp }) => lineUp)
      .flatMap((entry) =>
        typeof entry !== 'string' && entry.kind === 'quiz'
          ? [entry.language]
          : []
      )

  expect(new Set(quizLanguages('en'))).toEqual(new Set(['en']))
  expect(new Set(quizLanguages('fr'))).toEqual(new Set(['fr']))
})

describe('a ready-made line-up once loaded', () => {
  const music = readyMadeLineUpsFor('fr').find(({ id }) => id === 'music')
  const quick = readyMadeLineUpsFor('fr').find(({ id }) => id === 'quick')
  const loaded = (lineUp: ReadyMadeLineUp) =>
    withSavedEvening({
      evening: savedEveningOfReadyMade({ lineUp, name: lineUp.id }),
      locale: 'fr',
      rememberedFor: () => null,
      settings: DEFAULT_ROOM_SETTINGS
    })

  if (music === undefined || quick === undefined) {
    throw new Error('the music and quick line-ups ship')
  }

  it('[ready-made] is still the one loaded while its games stand, however each is set', () => {
    const settings = loaded(music)
    const retuned = {
      ...settings,
      lineUp: settings.lineUp.map((entry) =>
        entry.kind === 'blindtest'
          ? { ...entry, source: { kind: 'film' as const } }
          : entry
      )
    }

    expect(isOnReadyMade({ lineUp: music, settings })).toBe(true)
    expect(isOnReadyMade({ lineUp: music, settings: retuned })).toBe(true)
  })

  it('[ready-made] is another line-up once a game is added or taken out, or on another', () => {
    const settings = loaded(music)

    expect(
      isOnReadyMade({
        lineUp: music,
        settings: { ...settings, lineUp: settings.lineUp.slice(1) }
      })
    ).toBe(false)
    expect(isOnReadyMade({ lineUp: quick, settings })).toBe(false)
  })

  it('[ready-made] goes back to nothing planned, in a frame the server accepts', () => {
    const cleared = withNothingPlanned(loaded(music))

    expect(cleared.game).toBeNull()
    expect(cleared.lineUp).toEqual([])
    expect(cleared.mode).toEqual(DEFAULT_ROOM_SETTINGS.mode)
    expect(lineUpHolds(cleared)).toBe(true)
  })
})
