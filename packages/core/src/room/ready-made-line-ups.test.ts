import { describe, expect, it } from 'vitest'

import { gameSettingsSchema, shelvedGames } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import {
  type AnswerMode,
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  LINE_UP_MAX_ENTRIES
} from '@melee/protocol/room'
import { catalogueOf } from '@melee/protocol/track'

import {
  isJudgedByHost,
  isJudgedInEveryMode,
  modeOfferedBy
} from './game-modes'
import {
  type HostPreferences,
  rememberedSetupFor,
  rememberSettings
} from './host-preferences'
import { lineUpHolds, withNothingPlanned } from './line-up'
import {
  gameOfEntry,
  gamesOfLineUp,
  isOnReadyMade,
  type ReadyMadeLineUp,
  readyMadeLineUpIds,
  readyMadeLineUpsFor,
  rememberedOnReadyMade,
  savedEveningOfReadyMade,
  withReadyMadeFiled
} from './ready-made-line-ups'
import { movedToEntry, openedSetup, ROUND_COUNT_STEPS } from './room-settings'
import { withSavedEvening } from './saved-evening'

const leftEveryGameOn = ({
  locale,
  mode
}: {
  locale: Locale
  mode: AnswerMode
}): HostPreferences => {
  const { room } = rememberSettings({
    preferences: null,
    settings: DEFAULT_ROOM_SETTINGS
  })
  const games: HostPreferences['games'] = {}

  for (const game of shelvedGames) {
    games[game] = {
      ...openedSetup({ game, locale }),
      mode: DEFAULT_MODE_SETTINGS[mode]
    }
  }

  return { games, room }
}

/**
 * Every entry of `lineUp` as the room plays it once the line-up has loaded,
 * the way the console does: the load's frame filed, then the line-up's own
 * modes filed over it, then each draw reading them back.
 */
const playedEntries = ({
  lineUp,
  locale,
  preferences
}: {
  lineUp: ReadyMadeLineUp
  locale: Locale
  preferences: HostPreferences
}) => {
  const loaded = withSavedEvening({
    evening: savedEveningOfReadyMade({ lineUp, name: lineUp.id }),
    locale,
    rememberedFor: (game) =>
      rememberedOnReadyMade({ game, locale, preferences }),
    settings: DEFAULT_ROOM_SETTINGS
  })
  const filed = withReadyMadeFiled({
    lineUp,
    locale,
    preferences: rememberSettings({ preferences, settings: loaded })
  })

  return loaded.lineUp.map((entry, at) =>
    movedToEntry({
      at,
      locale,
      remembered: rememberedSetupFor({ game: entry.kind, preferences: filed }),
      settings: loaded
    })
  )
}

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
    '[ready-made] $id opens on games a room may be opened for, at a round count the strip offers or none',
    (lineUp) => {
      expect(gamesOfLineUp(lineUp).length).toBeGreaterThan(0)
      expect([...ROUND_COUNT_STEPS, null]).toContain(lineUp.roundCount)
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

  it.each(lineUps)(
    '[ready-made] $id answers every game the way it opens, whatever this host left it on',
    (lineUp) => {
      const played = playedEntries({
        lineUp,
        locale,
        preferences: leftEveryGameOn({ locale, mode: 'typed' })
      })

      for (const { game, mode } of played) {
        if (game === null) {
          throw new Error('every entry is a game')
        }

        expect(mode).toEqual(
          modeOfferedBy({
            game,
            preferred: openedSetup({ game: game.kind, locale }).mode
          })
        )
      }
    }
  )

  it('[ready-made] files only the mode, keeping what this host left each game at', () => {
    const preferences = leftEveryGameOn({ locale, mode: 'typed' })
    const quick = lineUps.find(({ id }) => id === 'quick')

    if (quick === undefined) {
      throw new Error('the quick line-up ships')
    }

    const filed = withReadyMadeFiled({ lineUp: quick, locale, preferences })

    expect(filed.games.innerclock).toEqual({
      ...preferences.games.innerclock,
      mode: DEFAULT_MODE_SETTINGS.buzzer
    })
    expect(filed.games.blindtest).toEqual(preferences.games.blindtest)
    expect(filed.room).toEqual(preferences.room)
  })
})

describe.each(['fr', 'en'] as const)('the grand mix in %s', (locale) => {
  const grandMix = readyMadeLineUpsFor(locale).find(
    ({ id }) => id === 'grandMix'
  )

  if (grandMix === undefined) {
    throw new Error('the grand mix ships')
  }

  it('[ready-made] plays no entry a host has to judge, even with every game left on the buzzer', () => {
    const played = playedEntries({
      lineUp: grandMix,
      locale,
      preferences: leftEveryGameOn({ locale, mode: 'buzzer' })
    })

    expect(played).toHaveLength(grandMix.lineUp.length)

    for (const { game, mode } of played) {
      expect(
        isJudgedByHost({ game: game?.kind ?? null, mode: mode.kind })
      ).toBe(false)
    }
  })

  it('[ready-made] answers every blind test and quiz on four candidates, even left on typing', () => {
    const played = playedEntries({
      lineUp: grandMix,
      locale,
      preferences: leftEveryGameOn({ locale, mode: 'typed' })
    }).filter(({ game }) => game?.kind === 'blindtest' || game?.kind === 'quiz')

    expect(played).toHaveLength(33)
    expect(new Set(played.map(({ mode }) => mode.kind))).toEqual(
      new Set(['choice'])
    )
  })

  it('[ready-made] leaves the evening open-ended and its order to the dealer', () => {
    expect(grandMix.roundCount).toBeNull()
    expect(grandMix.runningOrder).toEqual([])
    expect(grandMix.lineUp.length).toBeLessThanOrEqual(LINE_UP_MAX_ENTRIES)
  })

  it('[ready-made] plays every game no host judges, never twice on one setting', () => {
    const judgeFree = shelvedGames.filter((game) => !isJudgedInEveryMode(game))
    const settings = grandMix.lineUp.map((entry) => JSON.stringify(entry))

    expect(new Set(grandMix.lineUp.map(gameOfEntry))).toEqual(
      new Set(judgeFree)
    )
    expect(new Set(settings).size).toBe(settings.length)
  })

  it('[ready-made] plays every decade, chart, subject and map on an entry of its own', () => {
    const countOf = (game: string) =>
      grandMix.lineUp.filter((entry) => gameOfEntry(entry) === game).length

    expect(countOf('blindtest')).toBe(20)
    expect(countOf('quiz')).toBe(13)
    expect(countOf('atlas')).toBe(6)
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
          ? { ...entry, source: catalogueOf({ hasFilmScores: true }) }
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
