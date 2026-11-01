import {
  type AtlasSettings,
  type BlindtestSettings,
  DEFAULT_ATLAS_SETTINGS,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
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

/**
 * Adrien's own line-up for an evening of every game nobody has to judge, each
 * entry a variant, in the order he set it: every catalogue of the blind test, every subject of the quiz, the map four ways.
 */
const grandMixFor = (locale: Locale): SavedEntry[] => {
  const quiz = (
    category: (typeof DEFAULT_QUIZ_SETTINGS.categories)[number],
    { wellKnownOnly }: { wellKnownOnly: boolean }
  ) => quizOn({ categories: [category], locale, wellKnownOnly })

  return [
    blindtestOn({ kind: 'film' }),
    quiz('history', { wellKnownOnly: true }),
    atlasOn({ direction: 'place', places: ['countries'] }),
    'innerclock',
    'matchsticks',
    'blacksquare',
    'petitbac',
    'reflex',
    blindtestOn({ decades: ['1970s'], kind: 'decade' }),
    'timeline',
    quiz('geography', { wellKnownOnly: true }),
    blindtestOn({ decades: ['1980s'], kind: 'decade' }),
    quiz('flags', { wellKnownOnly: false }),
    atlasOn({ direction: 'name', places: ['countries'] }),
    blindtestOn({ decades: ['1990s'], kind: 'decade' }),
    quiz('capitals', { wellKnownOnly: false }),
    blindtestOn({ decades: ['2000s'], kind: 'decade' }),
    quiz('science', { wellKnownOnly: true }),
    atlasOn({ direction: 'place', places: ['frenchCities'] }),
    blindtestOn({ decades: ['2010s'], kind: 'decade' }),
    quiz('arts', { wellKnownOnly: true }),
    blindtestOn({ decades: [], kind: 'decade' }),
    quiz('cinema', { wellKnownOnly: false }),
    atlasOn({ direction: 'name', places: ['frenchCities'] }),
    blindtestOn({ kind: 'film' }),
    quiz('quotes', { wellKnownOnly: true }),
    quiz('rebus', { wellKnownOnly: false }),
    atlasOn({ direction: 'place', places: ['worldCapitals'] }),
    quiz('videogames', { wellKnownOnly: false }),
    quiz('sport', { wellKnownOnly: true }),
    atlasOn({ direction: 'name', places: ['worldCapitals'] }),
    quiz('everyday', { wellKnownOnly: true }),
    'swatch',
    'mostlikely',
    'higherlower',
    'estimate'
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
    roundCount: 40,
    runningOrder: [
      0, 1, 2, 8, 10, 4, 11, 12, 13, 14, 15, 6, 16, 17, 18, 19, 20, 7, 21, 22,
      23, 24, 25, 3, 26, 27, 28, 5, 29, 30, 9, 31, 32, 33, 34, 35
    ]
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
