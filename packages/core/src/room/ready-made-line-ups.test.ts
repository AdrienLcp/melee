import { describe, expect, it } from 'vitest'

import { fiveCluesSubjects } from '@melee/protocol/five-clues'
import { gameSettingsSchema, shelvedGames } from '@melee/protocol/game'
import { LOCALES, type Locale } from '@melee/protocol/locale'
import {
  type AnswerMode,
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  LINE_UP_MAX_ENTRIES
} from '@melee/protocol/room'
import { catalogueOf } from '@melee/protocol/track'

import { questionLanguageFor } from '../quiz/question-language'
import {
  isJudgedByHost,
  isJudgedInEveryMode,
  modeOfferedBy
} from './game-modes'
import { homeCountryFor } from './home-country'
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

describe.each(LOCALES)('ready-made line-ups in %s', (locale) => {
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

describe.each(LOCALES)('the grand mix in %s', (locale) => {
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

    expect(played).toHaveLength(locale === 'pt' ? 22 : 23)
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

  it('[ready-made] plays every decade, subject and map on an entry of its own, and only the charts a table names', () => {
    const countOf = (game: string) =>
      grandMix.lineUp.filter((entry) => gameOfEntry(entry) === game).length

    expect(countOf('blindtest')).toBe(locale === 'pt' ? 9 : 10)
    expect(
      grandMix.lineUp.filter(
        (entry) =>
          typeof entry !== 'string' &&
          entry.kind === 'blindtest' &&
          entry.clipWindowMs !== null
      )
    ).toEqual([
      expect.objectContaining({
        clipWindowMs: 1_000,
        source: expect.objectContaining({ charts: null, hasClassics: true })
      })
    ])
    expect(countOf('quiz')).toBe(13)
    expect(countOf('atlas')).toBe(6)
    expect(countOf('fiveclues')).toBe(fiveCluesSubjects.length)
  })
})

it.each(['quiz', 'mysteryword', 'longestword', 'thinkalike'] as const)(
  '[ready-made] deals %s in the language the table speaks',
  (game) => {
    const languagesOf = (locale: Locale) =>
      readyMadeLineUpsFor(locale)
        .flatMap(({ lineUp }) => lineUp)
        .flatMap((entry) =>
          typeof entry !== 'string' && entry.kind === game
            ? [entry.language]
            : []
        )

    for (const locale of LOCALES) {
      expect(new Set(languagesOf(locale))).toEqual(
        new Set([questionLanguageFor(locale)])
      )
    }
  }
)

describe('a Portuguese table', () => {
  const lineUps = readyMadeLineUpsFor('pt')
  const entriesOf = (game: string) =>
    lineUps
      .flatMap(({ lineUp }) => lineUp)
      .flatMap((entry) =>
        typeof entry !== 'string' && entry.kind === game ? [entry] : []
      )

  it('[ready-made] places the cities of Portugal, never those of France', () => {
    const places = entriesOf('atlas').flatMap((entry) =>
      entry.kind === 'atlas' ? entry.places : []
    )

    expect(places).toContain('portugueseCities')
    expect(places).not.toContain('frenchCities')
  })

  it('[ready-made] deals every blind test from Portugal but the borderless one’s, and the music special its own decades', () => {
    const blindTests = lineUps
      .filter(({ id }) => id !== 'international')
      .flatMap(({ lineUp }) => lineUp)
      .flatMap((entry) =>
        typeof entry !== 'string' && entry.kind === 'blindtest' ? [entry] : []
      )
    const music = lineUps.find(({ id }) => id === 'music')

    expect(
      blindTests.every(
        (entry) => entry.kind === 'blindtest' && entry.homeCountry === 'PRT'
      )
    ).toBe(true)
    expect(music?.lineUp).toEqual([
      expect.objectContaining({ source: catalogueOf({ decades: ['1980s'] }) }),
      expect.objectContaining({ source: catalogueOf({ decades: ['1990s'] }) }),
      expect.objectContaining({ source: catalogueOf({ hasFilmScores: true }) })
    ])
  })
})

it.each(LOCALES)(
  '[ready-made] deals the grand mix’s black squares the themes of the table’s own country in %s',
  (locale) => {
    const grandMix = readyMadeLineUpsFor(locale).find(
      ({ id }) => id === 'grandMix'
    )
    const homeCountries = (grandMix?.lineUp ?? []).flatMap((entry) =>
      typeof entry !== 'string' && entry.kind === 'blacksquare'
        ? [entry.homeCountry]
        : []
    )

    expect(new Set(homeCountries)).toEqual(new Set([homeCountryFor(locale)]))
  }
)

it.each(LOCALES)(
  '[ready-made] climbs every five clues but the borderless evening’s to the table’s own country in %s',
  (locale) => {
    const homeCountries = readyMadeLineUpsFor(locale)
      .filter(({ id }) => id !== 'international')
      .flatMap(({ lineUp }) => lineUp)
      .flatMap((entry) =>
        typeof entry !== 'string' && entry.kind === 'fiveclues'
          ? [entry.homeCountry]
          : []
      )

    expect(homeCountries.length).toBeGreaterThan(fiveCluesSubjects.length)
    expect(new Set(homeCountries)).toEqual(new Set([homeCountryFor(locale)]))
  }
)

describe.each(LOCALES)('the borderless evening in %s', (locale) => {
  const international = readyMadeLineUpsFor(locale).find(
    ({ id }) => id === 'international'
  )

  if (international === undefined) {
    throw new Error('the borderless evening ships')
  }

  const spelled = international.lineUp.flatMap((entry) =>
    typeof entry === 'string' ? [] : [entry]
  )

  it('[ready-made] plays every game no host judges but the word games, never twice on one setting', () => {
    const settings = international.lineUp.map((entry) => JSON.stringify(entry))

    expect(new Set(international.lineUp.map(gameOfEntry))).toEqual(
      new Set(
        shelvedGames.filter(
          (game) =>
            !isJudgedInEveryMode(game) &&
            !['longestword', 'mysteryword', 'petitbac', 'thinkalike'].includes(
              game
            )
        )
      )
    )
    expect(new Set(settings).size).toBe(settings.length)
    expect(international.lineUp.length).toBeLessThanOrEqual(LINE_UP_MAX_ENTRIES)
  })

  it('[ready-made] deals no table’s own content, whatever the host’s language', () => {
    const homeCountries = spelled.flatMap((entry) =>
      'homeCountry' in entry ? [entry.homeCountry] : []
    )
    const games = new Set(
      spelled.flatMap((entry) => ('homeCountry' in entry ? [entry.kind] : []))
    )

    expect(games).toEqual(
      new Set([
        'blacksquare',
        'blindtest',
        'estimate',
        'fiveclues',
        'higherlower',
        'timeline'
      ])
    )
    expect(new Set(homeCountries)).toEqual(new Set([null]))
  })

  it('[ready-made] places countries and world capitals alone, and hears no chart', () => {
    const places = spelled.flatMap((entry) =>
      entry.kind === 'atlas' ? entry.places : []
    )
    const charts = spelled.flatMap((entry) =>
      entry.kind === 'blindtest' && entry.source.kind === 'catalogue'
        ? (entry.source.charts ?? [])
        : []
    )

    expect(new Set(places)).toEqual(new Set(['countries', 'worldCapitals']))
    expect(charts).toEqual([])
  })

  it('[ready-made] asks only the quiz subjects each screen names in its own language', () => {
    const categories = spelled.flatMap((entry) =>
      entry.kind === 'quiz' ? entry.categories : []
    )

    expect(categories).toEqual(['flags', 'capitals', 'silhouettes'])
  })
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
