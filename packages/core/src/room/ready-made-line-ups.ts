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

import { questionLanguageFor } from '../quiz/question-language'
import type { SavedEntry, SavedEvening } from './saved-evening'
import { isShelvedGame } from './shelved-game'

export const readyMadeLineUpIds = [
  'firstGame',
  'music',
  'generalKnowledge',
  'quick',
  'grandMix'
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
  wellKnownOnly = DEFAULT_QUIZ_SETTINGS.wellKnownOnly
}: {
  categories: typeof DEFAULT_QUIZ_SETTINGS.categories
  locale: Locale
  wellKnownOnly?: boolean
}): SavedEntry => ({
  ...DEFAULT_QUIZ_SETTINGS,
  categories,
  language: questionLanguageFor(locale),
  wellKnownOnly
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
    { wellKnownOnly }: { wellKnownOnly: boolean }
  ) => quizOn({ categories: [category], locale, wellKnownOnly })

  return [
    blindtestOn({ kind: 'film' }),
    quiz('geography', { wellKnownOnly: true }),
    {
      ...DEFAULT_BLACK_SQUARE_SETTINGS,
      answerCount: 6,
      doublesLoneFinds: true
    },
    blindtestOn({ decades: ['2010s'], kind: 'decade' }),
    quiz('videogames', { wellKnownOnly: false }),
    atlasOn({ direction: 'name', places: ['countries'] }),
    { ...DEFAULT_SWATCH_SETTINGS, showMs: 5_000 },
    blindtestOn({ decades: ['1980s'], kind: 'decade' }),
    quiz('sport', { wellKnownOnly: true }),
    'innerclock',
    atlasOn({ direction: 'place', places: ['frenchCities'] }),
    quiz('everyday', { wellKnownOnly: true }),
    blindtestOn({ decades: ['1970s'], kind: 'decade' }),
    {
      ...DEFAULT_PETIT_BAC_SETTINGS,
      categoryCount: 4,
      roundDurationMs: 60_000
    },
    quiz('flags', { wellKnownOnly: false }),
    'higherlower',
    { ...DEFAULT_MATCHSTICKS_SETTINGS, goals: ['equation'] },
    quiz('history', { wellKnownOnly: true }),
    blindtestOn({ decades: [], kind: 'decade' }),
    atlasOn({ direction: 'place', places: ['countries'] }),
    quiz('rebus', { wellKnownOnly: false }),
    blindtestOn({ decades: ['1990s'], kind: 'decade' }),
    { ...DEFAULT_BLACK_SQUARE_SETTINGS, answerCount: 9 },
    quiz('capitals', { wellKnownOnly: false }),
    { ...DEFAULT_SWATCH_SETTINGS, showMs: 3_000 },
    blindtestOn({ genreIds: [FRENCH_CHANSON_GENRE_ID], kind: 'chart' }),
    atlasOn({ direction: 'name', places: ['worldCapitals'] }),
    'mostlikely',
    quiz('quotes', { wellKnownOnly: true }),
    'reflex',
    atlasOn({ direction: 'place', places: ['worldCapitals'] }),
    blindtestOn({ decades: ['2000s'], kind: 'decade' }),
    quiz('science', { wellKnownOnly: true }),
    'timeline',
    { ...DEFAULT_PETIT_BAC_SETTINGS, categoryCount: 6 },
    quiz('arts', { wellKnownOnly: true }),
    { ...DEFAULT_MATCHSTICKS_SETTINGS, goals: ['biggest', 'smallest'] },
    atlasOn({ direction: 'name', places: ['frenchCities'] }),
    'estimate',
    quiz('cinema', { wellKnownOnly: false })
  ]
}

/**
 * The five, in the order the home page and the lobby draw them. A game named
 * bare takes what this host last left it at, or its opening settings; a
 * variant — a blind test on one source, a quiz on one subject — is spelled out.
 * *First game* leaves out most likely: it falls flat with two players.
 * *Grand mix* is every game nobody has to judge, a variant per entry.
 */
export const readyMadeLineUpsFor = (
  locale: Locale
): readonly ReadyMadeLineUp[] => [
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
        source: { genreIds: [FRENCH_CHANSON_GENRE_ID], kind: 'chart' }
      },
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        source: { decades: ['1980s'], kind: 'decade' }
      },
      { ...DEFAULT_BLINDTEST_SETTINGS, source: { kind: 'film' } }
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
  },
  {
    id: 'grandMix',
    lineUp: grandMixFor(locale),
    lineUpDeals: [],
    roundCount: GRAND_MIX_ROUND_COUNT,
    runningOrder: Array.from({ length: GRAND_MIX_ROUND_COUNT }, (_, at) => at)
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
