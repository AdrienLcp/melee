import type { Difficulty } from '@melee/protocol/difficulty'
import {
  type AtlasSettings,
  type BlindtestSettings,
  DEFAULT_ATLAS_SETTINGS,
  DEFAULT_BLACK_SQUARE_SETTINGS,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_MATCHSTICKS_SETTINGS,
  DEFAULT_PETIT_BAC_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_SWATCH_SETTINGS,
  type GameKind,
  type ShelvedGame
} from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import type { RoomSettings } from '@melee/protocol/room'
import { catalogueOf } from '@melee/protocol/track'

import { questionLanguageFor } from '../quiz/question-language'
import { type HostPreferences, rememberedSetupFor } from './host-preferences'
import { type GameSetup, openedSetup } from './room-settings'
import type { SavedEntry, SavedEvening } from './saved-evening'
import { isShelvedGame } from './shelved-game'

export const readyMadeLineUpIds = [
  'grandMix',
  'firstGame',
  'music',
  'generalKnowledge',
  'quick'
] as const

export type ReadyMadeLineUpId = (typeof readyMadeLineUpIds)[number]

/**
 * A line-up the app ships, for a host who has never made one: a saved line-up
 * with no name of its own, because its name and caption are the dictionaries'.
 */
export type ReadyMadeLineUp = Omit<SavedEvening, 'name'> & {
  id: ReadyMadeLineUpId
}

const FRENCH_CHANSON_GENRE_ID = 52

const quizOn = ({
  categories,
  locale,
  difficulty = DEFAULT_QUIZ_SETTINGS.difficulty
}: {
  categories: typeof DEFAULT_QUIZ_SETTINGS.categories
  locale: Locale
  difficulty?: Difficulty
}): SavedEntry => ({
  ...DEFAULT_QUIZ_SETTINGS,
  categories,
  difficulty,
  language: questionLanguageFor(locale)
})

const blindtestOn = (source: BlindtestSettings['source']): SavedEntry => ({
  ...DEFAULT_BLINDTEST_SETTINGS,
  source
})

const atlasOn = ({
  direction,
  places
}: Pick<AtlasSettings, 'direction' | 'places'>): SavedEntry => ({
  ...DEFAULT_ATLAS_SETTINGS,
  direction,
  places
})

const GENERAL_QUIZ_CATEGORIES = [
  'history',
  'geography',
  'science',
  'arts',
  'cinema',
  'sport',
  'everyday'
] as const satisfies typeof DEFAULT_QUIZ_SETTINGS.categories

const GRAND_MIX_ROUND_COUNT = 40

/**
 * Every game nobody has to judge, each entry on a setting of its own, in an
 * order that never brings a game — nor a near cousin of it: two rounds on the
 * map, two word sheets, two races against the clock — back within three rounds.
 */
const grandMixFor = (locale: Locale): SavedEntry[] => {
  const quiz = (
    category: (typeof DEFAULT_QUIZ_SETTINGS.categories)[number],
    { difficulty }: { difficulty: Difficulty }
  ) => quizOn({ categories: [category], difficulty, locale })

  return [
    blindtestOn(catalogueOf({ hasFilmScores: true })),
    quiz('geography', { difficulty: 'easy' }),
    {
      ...DEFAULT_BLACK_SQUARE_SETTINGS,
      answerCount: 6,
      doublesLoneFinds: true
    },
    blindtestOn(catalogueOf({ decades: ['2010s'] })),
    quiz('videogames', { difficulty: 'mixed' }),
    atlasOn({ direction: 'name', places: ['countries'] }),
    { ...DEFAULT_SWATCH_SETTINGS, showMs: 5_000 },
    blindtestOn(catalogueOf({ decades: ['1980s'] })),
    quiz('sport', { difficulty: 'easy' }),
    'innerclock',
    atlasOn({ direction: 'place', places: ['frenchCities'] }),
    quiz('everyday', { difficulty: 'easy' }),
    blindtestOn(catalogueOf({ decades: ['1970s'] })),
    {
      ...DEFAULT_PETIT_BAC_SETTINGS,
      categoryCount: 4,
      roundDurationMs: 60_000
    },
    quiz('flags', { difficulty: 'mixed' }),
    'higherlower',
    { ...DEFAULT_MATCHSTICKS_SETTINGS, goals: ['equation'] },
    quiz('history', { difficulty: 'easy' }),
    blindtestOn(catalogueOf({ decades: [] })),
    atlasOn({ direction: 'place', places: ['countries'] }),
    quiz('rebus', { difficulty: 'mixed' }),
    blindtestOn(catalogueOf({ decades: ['1990s'] })),
    { ...DEFAULT_BLACK_SQUARE_SETTINGS, answerCount: 9 },
    quiz('capitals', { difficulty: 'mixed' }),
    { ...DEFAULT_SWATCH_SETTINGS, showMs: 3_000 },
    blindtestOn(catalogueOf({ charts: [FRENCH_CHANSON_GENRE_ID] })),
    atlasOn({ direction: 'name', places: ['worldCapitals'] }),
    'mostlikely',
    quiz('quotes', { difficulty: 'easy' }),
    'reflex',
    atlasOn({ direction: 'place', places: ['worldCapitals'] }),
    blindtestOn(catalogueOf({ decades: ['2000s'] })),
    quiz('science', { difficulty: 'easy' }),
    'timeline',
    { ...DEFAULT_PETIT_BAC_SETTINGS, categoryCount: 6 },
    quiz('arts', { difficulty: 'easy' }),
    { ...DEFAULT_MATCHSTICKS_SETTINGS, goals: ['biggest', 'smallest'] },
    atlasOn({ direction: 'name', places: ['frenchCities'] }),
    'estimate',
    quiz('cinema', { difficulty: 'mixed' })
  ]
}

/**
 * The five, in the order the home page and the lobby draw them. A game named
 * bare takes what this host last left it at, or its opening settings; a
 * variant — a blind test on one source, a quiz on one subject — is spelled out.
 * Every game is answered the way it opens (`rememberedOnReadyMade`).
 * *First game* leaves out most likely: it falls flat with two players.
 * *Free-for-all* is every game nobody has to judge, a variant per entry.
 */
export const readyMadeLineUpsFor = (
  locale: Locale
): readonly ReadyMadeLineUp[] => [
  {
    id: 'grandMix',
    lineUp: grandMixFor(locale),
    lineUpDeals: [],
    roundCount: GRAND_MIX_ROUND_COUNT,
    runningOrder: Array.from({ length: GRAND_MIX_ROUND_COUNT }, (_, at) => at)
  },
  {
    id: 'firstGame',
    lineUp: ['blindtest', 'quiz', 'higherlower', 'reflex', 'atlas'],
    lineUpDeals: [],
    roundCount: 20,
    runningOrder: []
  },
  {
    id: 'music',
    lineUp: [
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: catalogueOf({ charts: [FRENCH_CHANSON_GENRE_ID] })
      },
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: catalogueOf({ decades: ['1980s'] })
      },
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: catalogueOf({ hasFilmScores: true })
      }
    ],
    lineUpDeals: [],
    roundCount: 20,
    runningOrder: []
  },
  {
    id: 'generalKnowledge',
    lineUp: [
      quizOn({
        categories: [...GENERAL_QUIZ_CATEGORIES],
        locale
      }),
      quizOn({ categories: ['flags'], locale }),
      'atlas',
      'timeline',
      'estimate'
    ],
    lineUpDeals: [],
    roundCount: 20,
    runningOrder: []
  },
  {
    id: 'quick',
    lineUp: ['reflex', 'swatch', 'innerclock', 'matchsticks'],
    lineUpDeals: [],
    roundCount: 10,
    runningOrder: []
  }
]

export const gameOfEntry = (entry: SavedEntry): GameKind =>
  typeof entry === 'string' ? entry : entry.kind

/** The games a ready-made line-up plays, once each, in its order. */
export const gamesOfLineUp = (
  lineUp: ReadyMadeLineUp
): readonly ShelvedGame[] => [
  ...new Set(lineUp.lineUp.map(gameOfEntry).filter(isShelvedGame))
]

/**
 * What this host last left `game` set to, answered the way the game opens
 * whatever mode they left it on. A ready-made line-up is set by the app, and
 * the promise two of them make — nothing to judge — holds on those modes
 * alone: a blind test left on the buzzer would hand the console a verdict
 * every round, one left on typing would have the table type an artist over
 * a clip.
 */
export const rememberedOnReadyMade = ({
  game,
  locale,
  preferences
}: {
  game: GameKind
  locale: Locale
  preferences: HostPreferences | null
}): GameSetup => {
  const opened = openedSetup({ game, locale })
  const remembered = rememberedSetupFor({ game, preferences })

  return remembered === null ? opened : { ...remembered, mode: opened.mode }
}

/**
 * The preferences with every game `lineUp` plays filed on the mode it opens
 * on. Each draw of an evening reads the mode back from the preferences, so
 * filing it once as the line-up loads is what holds it to its last round.
 */
export const withReadyMadeFiled = ({
  lineUp,
  locale,
  preferences
}: {
  lineUp: ReadyMadeLineUp
  locale: Locale
  preferences: HostPreferences
}): HostPreferences => {
  const games = { ...preferences.games }

  for (const game of new Set(lineUp.lineUp.map(gameOfEntry))) {
    games[game] = rememberedOnReadyMade({ game, locale, preferences })
  }

  return { ...preferences, games }
}

/** A ready-made line-up as a saved one, under the name the dictionary gives it. */
export const savedEveningOfReadyMade = ({
  lineUp,
  name
}: {
  lineUp: ReadyMadeLineUp
  name: string
}): SavedEvening => ({
  lineUp: lineUp.lineUp,
  lineUpDeals: lineUp.lineUpDeals,
  name,
  roundCount: lineUp.roundCount,
  runningOrder: lineUp.runningOrder
})

/**
 * Whether the room still plays `lineUp`: the same games in the same entries,
 * however the host has set each since. A game added or taken out makes it the
 * host's own line-up.
 */
export const isOnReadyMade = ({
  lineUp,
  settings
}: {
  lineUp: ReadyMadeLineUp
  settings: RoomSettings
}): boolean =>
  settings.lineUp.length === lineUp.lineUp.length &&
  settings.lineUp.every(
    (entry, at) => entry.kind === gameOfEntry(lineUp.lineUp[at] ?? entry.kind)
  )
