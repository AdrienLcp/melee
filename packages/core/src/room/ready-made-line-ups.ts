import type { Difficulty } from '@melee/protocol/difficulty'
import {
  type AtlasSettings,
  type BlindtestSettings,
  DEFAULT_ATLAS_SETTINGS,
  DEFAULT_BLACK_SQUARE_SETTINGS,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_LONGEST_WORD_SETTINGS,
  DEFAULT_MATCHSTICKS_SETTINGS,
  DEFAULT_MYSTERY_WORD_SETTINGS,
  DEFAULT_PETIT_BAC_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_SWATCH_SETTINGS,
  type GameKind,
  type ShelvedGame,
  shelvedGames
} from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import {
  type QuestionCategory,
  questionCategories
} from '@melee/protocol/question'
import type { RoomSettings } from '@melee/protocol/room'
import { SWATCH_SHOW_MS } from '@melee/protocol/swatch'
import {
  catalogueOf,
  GENRE_IDS,
  type GenreId,
  trackDecades
} from '@melee/protocol/track'

import { questionLanguageFor } from '../quiz/question-language'
import { isJudgedInEveryMode } from './game-modes'
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
export type ReadyMadeLineUp = Omit<SavedEvening, 'decks' | 'name'> & {
  id: ReadyMadeLineUpId
}

const FRENCH_CHANSON_GENRE_ID: GenreId = 52

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

/**
 * The level each quiz subject plays at in the grand mix: an easy question
 * where the bank has enough of them, every level where an easy deck runs thin.
 */
const GRAND_MIX_QUIZ_DIFFICULTY: Record<QuestionCategory, Difficulty> = {
  arts: 'easy',
  capitals: 'mixed',
  cinema: 'mixed',
  everyday: 'easy',
  flags: 'mixed',
  geography: 'easy',
  history: 'easy',
  quotes: 'easy',
  rebus: 'mixed',
  science: 'easy',
  silhouettes: 'mixed',
  sport: 'easy',
  videogames: 'mixed'
}

/**
 * A short word and a long one, rather than every length: the word sheets are
 * one family to the dealer, and four lengths beside black square's three and
 * Petit Bac's two held the other games under their share of the evening.
 */
const GRAND_MIX_WORD_LENGTHS = [5, 7] as const

/**
 * One entry per value of a game's main content axis — each decade, each
 * subject, each map — and never their cross product, which would hand one
 * game most of the evening. Never the whole axis either: a blind test on every
 * decade at once added nothing the decades do not deal, and was the twentieth
 * blind test of sixty entries, a third of the evening exactly, which leaves no
 * order spacing every game its share. A game named nowhere here joins bare.
 */
const grandMixVarietiesOf = (
  locale: Locale
): Partial<Record<ShelvedGame, readonly SavedEntry[]>> => ({
  atlas: (['place', 'name'] as const).flatMap((direction) =>
    (['countries', 'frenchCities', 'worldCapitals'] as const).map((place) =>
      atlasOn({ direction, places: [place] })
    )
  ),
  blacksquare: [3, 6, 9].map((answerCount) => ({
    ...DEFAULT_BLACK_SQUARE_SETTINGS,
    answerCount
  })),
  blindtest: [
    ...trackDecades.map((decade) =>
      blindtestOn(catalogueOf({ decades: [decade] }))
    ),
    blindtestOn(catalogueOf({ hasFilmScores: true })),
    ...GENRE_IDS.map((genre) => blindtestOn(catalogueOf({ charts: [genre] })))
  ],
  longestword: [
    { ...DEFAULT_LONGEST_WORD_SETTINGS, language: questionLanguageFor(locale) }
  ],
  matchsticks: DEFAULT_MATCHSTICKS_SETTINGS.goals.map((goal) => ({
    ...DEFAULT_MATCHSTICKS_SETTINGS,
    goals: [goal]
  })),
  mysteryword: GRAND_MIX_WORD_LENGTHS.map((wordLength) => ({
    ...DEFAULT_MYSTERY_WORD_SETTINGS,
    language: questionLanguageFor(locale),
    wordLength
  })),
  petitbac: [
    {
      ...DEFAULT_PETIT_BAC_SETTINGS,
      categoryCount: 4,
      roundDurationMs: 60_000
    },
    { ...DEFAULT_PETIT_BAC_SETTINGS, categoryCount: 6 }
  ],
  quiz: questionCategories.map((category) =>
    quizOn({
      categories: [category],
      difficulty: GRAND_MIX_QUIZ_DIFFICULTY[category],
      locale
    })
  ),
  swatch: SWATCH_SHOW_MS.map((showMs) => ({
    ...DEFAULT_SWATCH_SETTINGS,
    showMs
  }))
})

/**
 * Every setting of every game nobody has to judge, so one evening shows the
 * table the whole shelf. A game shelved later joins on its own, bare until it
 * names its varieties. The order is the dealer's (`spacedCycle`), which keeps
 * each game — and each family of near cousins — its share of the evening apart.
 */
const grandMixFor = (locale: Locale): SavedEntry[] => {
  const varieties = grandMixVarietiesOf(locale)

  return shelvedGames
    .filter((game) => !isJudgedInEveryMode(game))
    .flatMap((game) => varieties[game] ?? [game])
}

/**
 * The five, in the order the home page and the lobby draw them. A game named
 * bare takes what this host last left it at, or its opening settings; a
 * variant — a blind test on one source, a quiz on one subject — is spelled out.
 * Every game is answered the way it opens (`rememberedOnReadyMade`).
 * *First game* leaves out most likely: it falls flat with two players.
 * *Free-for-all* is every setting of every game nobody has to judge, with
 * no last round.
 */
export const readyMadeLineUpsFor = (
  locale: Locale
): readonly ReadyMadeLineUp[] => [
  {
    id: 'grandMix',
    lineUp: grandMixFor(locale),
    lineUpDeals: [],
    roundCount: null,
    runningOrder: []
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
  decks: [],
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
