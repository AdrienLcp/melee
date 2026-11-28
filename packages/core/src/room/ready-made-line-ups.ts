import type { AtlasCityPlaces } from '@melee/protocol/atlas'
import type { CountryCode } from '@melee/protocol/country-code'
import type { Difficulty } from '@melee/protocol/difficulty'
import { fiveCluesSubjects } from '@melee/protocol/five-clues'
import {
  type AtlasSettings,
  type BlindtestSettings,
  DEFAULT_ATLAS_SETTINGS,
  DEFAULT_BLACK_SQUARE_SETTINGS,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_ESTIMATE_SETTINGS,
  DEFAULT_FIVE_CLUES_SETTINGS,
  DEFAULT_HIGHER_LOWER_SETTINGS,
  DEFAULT_LONGEST_WORD_SETTINGS,
  DEFAULT_MATCHSTICKS_SETTINGS,
  DEFAULT_MYSTERY_WORD_SETTINGS,
  DEFAULT_PETIT_BAC_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_SWATCH_SETTINGS,
  DEFAULT_THINK_ALIKE_SETTINGS,
  DEFAULT_TIMELINE_SETTINGS,
  type GameKind,
  type ShelvedGame,
  shelvedGames
} from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import {
  everyLanguageCategories,
  type QuestionCategory,
  questionCategories
} from '@melee/protocol/question'
import type { RoomSettings } from '@melee/protocol/room'
import { SWATCH_SHOW_MS } from '@melee/protocol/swatch'
import { catalogueOf, type GenreId, trackDecades } from '@melee/protocol/track'

import { questionLanguageFor } from '../quiz/question-language'
import { isJudgedInEveryMode } from './game-modes'
import { homeCountryFor } from './home-country'
import { type HostPreferences, rememberedSetupFor } from './host-preferences'
import { type GameSetup, openedSetup } from './room-settings'
import type { SavedEntry, SavedEvening } from './saved-evening'
import { isShelvedGame } from './shelved-game'

export const readyMadeLineUpIds = [
  'grandMix',
  'international',
  'firstGame',
  'family',
  'music',
  'generalKnowledge',
  'quick'
] as const

export type ReadyMadeLineUpId = (typeof readyMadeLineUpIds)[number]

/** The room settings a ready-made line-up may answer beside its entries. */
export type ReadyMadeRoom = Partial<
  Pick<RoomSettings, 'isFamilyFriendly' | 'paysForSpeed'>
>

/**
 * A line-up the app ships, for a host who has never made one: a saved line-up
 * with no name of its own, because its name and caption are the dictionaries'.
 * `room` is laid over the room as it loads, and the console then remembers it
 * like anything else the host set — a saved evening carries none, since what a
 * host keeps under a name is the games and their order.
 */
export type ReadyMadeLineUp = Omit<SavedEvening, 'decks' | 'name'> & {
  id: ReadyMadeLineUpId
  room?: ReadyMadeRoom
}

const FRENCH_CHANSON_GENRE_ID: GenreId = 52
const RAP_GENRE_ID: GenreId = 116

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

const blindtestOn = ({
  locale,
  source
}: {
  locale: Locale
  source: BlindtestSettings['source']
}): SavedEntry => ({
  ...DEFAULT_BLINDTEST_SETTINGS,
  homeCountry: homeCountryFor(locale),
  source
})

/**
 * A second of a song the whole table knows, then the answer time in silence:
 * the classics alone, because a flash of anything less famous is a guess. A
 * shorter round than the blind test's own, since nothing more is coming.
 */
const FLASH_WINDOW_MS = 1_000
const FLASH_ROUND_MS = 15_000

const flashOn = (homeCountry: CountryCode | null): BlindtestSettings => ({
  ...DEFAULT_BLINDTEST_SETTINGS,
  clipWindowMs: FLASH_WINDOW_MS,
  homeCountry,
  roundDurationMs: FLASH_ROUND_MS,
  source: catalogueOf({ hasClassics: true })
})

/** The cities a table places in the grand mix: its own country's, France's for a table with none. */
const CITIES_OF_LOCALE = {
  en: 'frenchCities',
  fr: 'frenchCities',
  pt: 'portugueseCities'
} as const satisfies Record<Locale, AtlasCityPlaces>

/**
 * The music special's three blind tests. A French table opens on its chanson
 * chart; Deezer has no Portuguese one, so a Portuguese table hears its own
 * eighties and nineties, which its decades deal beside the world's.
 */
const MUSIC_SPECIAL_OF_LOCALE = {
  en: [
    catalogueOf({ charts: [FRENCH_CHANSON_GENRE_ID] }),
    catalogueOf({ decades: ['1980s'] }),
    catalogueOf({ hasFilmScores: true })
  ],
  fr: [
    catalogueOf({ charts: [FRENCH_CHANSON_GENRE_ID] }),
    catalogueOf({ decades: ['1980s'] }),
    catalogueOf({ hasFilmScores: true })
  ],
  pt: [
    catalogueOf({ decades: ['1980s'] }),
    catalogueOf({ decades: ['1990s'] }),
    catalogueOf({ hasFilmScores: true })
  ]
} as const satisfies Record<Locale, readonly BlindtestSettings['source'][]>

const atlasOn = ({
  direction,
  places
}: Pick<AtlasSettings, 'direction' | 'places'>): SavedEntry => ({
  ...DEFAULT_ATLAS_SETTINGS,
  direction,
  places
})

const fiveCluesIn = (locale: Locale): SavedEntry => ({
  ...DEFAULT_FIVE_CLUES_SETTINGS,
  homeCountry: homeCountryFor(locale)
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
  kids: 'easy',
  quotes: 'easy',
  rebus: 'mixed',
  science: 'easy',
  silhouettes: 'mixed',
  sport: 'easy',
  videogames: 'mixed'
}

/**
 * Every quiz subject but the one written for a child, which the family
 * evening plays and an evening of adults leaves out.
 */
const isForEveryTable = (category: QuestionCategory): boolean =>
  category !== 'kids'

/**
 * The charts the grand mix plays beside its decades: the ones a table names
 * that the decades do not already deal. Pop and dance are what every decade's
 * chart is made of, and metal, reggae or jazz are one corner of the room.
 * Rock gave its entry to the flash: the seventies to the nineties deal it
 * already, and an eleventh blind test left the dealer no order spacing it
 * its share of the evening. Deezer's chanson chart is France's, which a
 * Portuguese table leaves out.
 */
const GRAND_MIX_CHARTS_OF_LOCALE = {
  en: [RAP_GENRE_ID, FRENCH_CHANSON_GENRE_ID],
  fr: [RAP_GENRE_ID, FRENCH_CHANSON_GENRE_ID],
  pt: [RAP_GENRE_ID]
} as const satisfies Record<Locale, readonly GenreId[]>

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
    (['countries', CITIES_OF_LOCALE[locale], 'worldCapitals'] as const).map(
      (place) => atlasOn({ direction, places: [place] })
    )
  ),
  blacksquare: [3, 6, 9].map((answerCount) => ({
    ...DEFAULT_BLACK_SQUARE_SETTINGS,
    answerCount,
    homeCountry: homeCountryFor(locale)
  })),
  blindtest: [
    ...trackDecades.map((decade) =>
      blindtestOn({ locale, source: catalogueOf({ decades: [decade] }) })
    ),
    blindtestOn({ locale, source: catalogueOf({ hasFilmScores: true }) }),
    ...GRAND_MIX_CHARTS_OF_LOCALE[locale].map((genre) =>
      blindtestOn({ locale, source: catalogueOf({ charts: [genre] }) })
    ),
    flashOn(homeCountryFor(locale))
  ],
  fiveclues: fiveCluesSubjects.map((subject) => ({
    ...DEFAULT_FIVE_CLUES_SETTINGS,
    homeCountry: homeCountryFor(locale),
    subjects: [subject]
  })),
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
  quiz: questionCategories.filter(isForEveryTable).map((category) =>
    quizOn({
      categories: [category],
      difficulty: GRAND_MIX_QUIZ_DIFFICULTY[category],
      locale
    })
  ),
  swatch: SWATCH_SHOW_MS.map((showMs) => ({
    ...DEFAULT_SWATCH_SETTINGS,
    showMs
  })),
  thinkalike: [
    { ...DEFAULT_THINK_ALIKE_SETTINGS, language: questionLanguageFor(locale) }
  ]
})

/**
 * A bit of every game nobody has to judge, so one evening shows the table the
 * whole shelf without any one game taking it over. A game shelved later joins on its own, bare until it
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
 * The games a table split between two languages cannot play fairly: a word
 * matched between two dictionaries never matches, and Petit Bac would pay a
 * word in the other language double as nobody else's.
 */
const WORD_GAMES = new Set<ShelvedGame>([
  'longestword',
  'mysteryword',
  'petitbac',
  'thinkalike'
])

/**
 * The grand mix with nothing tied to one country: no table's own content
 * (`homeCountry` `null` wherever a game deals one), no city set, no chart, and
 * of the quiz only the subjects each screen names in its own language.
 */
const internationalVarietiesOf = (
  locale: Locale
): Partial<Record<ShelvedGame, readonly SavedEntry[]>> => {
  const varieties = grandMixVarietiesOf(locale)

  return {
    ...varieties,
    atlas: (['place', 'name'] as const).flatMap((direction) =>
      (['countries', 'worldCapitals'] as const).map((place) =>
        atlasOn({ direction, places: [place] })
      )
    ),
    blacksquare: [3, 6, 9].map((answerCount) => ({
      ...DEFAULT_BLACK_SQUARE_SETTINGS,
      answerCount
    })),
    blindtest: [
      ...trackDecades.map((decade) => ({
        ...DEFAULT_BLINDTEST_SETTINGS,
        homeCountry: null,
        source: catalogueOf({ decades: [decade] })
      })),
      {
        ...DEFAULT_BLINDTEST_SETTINGS,
        homeCountry: null,
        source: catalogueOf({ hasFilmScores: true })
      },
      flashOn(null)
    ],
    estimate: [{ ...DEFAULT_ESTIMATE_SETTINGS, homeCountry: null }],
    fiveclues: fiveCluesSubjects.map((subject) => ({
      ...DEFAULT_FIVE_CLUES_SETTINGS,
      homeCountry: null,
      subjects: [subject]
    })),
    higherlower: [{ ...DEFAULT_HIGHER_LOWER_SETTINGS, homeCountry: null }],
    quiz: everyLanguageCategories.filter(isForEveryTable).map((category) =>
      quizOn({
        categories: [category],
        difficulty: GRAND_MIX_QUIZ_DIFFICULTY[category],
        locale
      })
    ),
    timeline: [DEFAULT_TIMELINE_SETTINGS]
  }
}

/**
 * A table where nobody shares one culture — a French grandmother beside a
 * Portuguese one — each screen reading every round in its own language.
 */
const internationalFor = (locale: Locale): SavedEntry[] => {
  const varieties = internationalVarietiesOf(locale)

  return shelvedGames
    .filter((game) => !isJudgedInEveryMode(game) && !WORD_GAMES.has(game))
    .flatMap((game) => varieties[game] ?? [game])
}

/** The room a child plays in beside adults: right is what pays. */
const FAMILY_ROOM = {
  isFamilyFriendly: true,
  paysForSpeed: false
} as const satisfies ReadyMadeRoom

/** The longest look at a colour the game offers, for the youngest eye. */
const FAMILY_SWATCH_SHOW_MS = Math.max(...SWATCH_SHOW_MS)

/**
 * A ten-year-old beside the adults, at one table: the games where a reflex,
 * an eye or a guess matters as much as knowing, the knowledge games at their
 * easiest — the quiz on the rubric written for a child, the emoji rebus and
 * the flags — and the children's songs on the blind test. Nothing a host
 * judges, no spelling or mental arithmetic raced against an adult, no city
 * map. Speed is not paid (`FAMILY_ROOM`): being right is the game.
 */
const familyFor = (locale: Locale): SavedEntry[] => {
  const homeCountry = homeCountryFor(locale)

  return [
    {
      ...DEFAULT_BLINDTEST_SETTINGS,
      difficulty: 'easy',
      homeCountry,
      source: catalogueOf({ hasChildrenSongs: true })
    },
    quizOn({ categories: ['kids'], difficulty: 'easy', locale }),
    quizOn({ categories: ['rebus'], difficulty: 'easy', locale }),
    quizOn({ categories: ['flags'], difficulty: 'easy', locale }),
    {
      ...DEFAULT_FIVE_CLUES_SETTINGS,
      difficulty: 'easy',
      homeCountry,
      subjects: ['animal', 'character', 'film']
    },
    { ...DEFAULT_TIMELINE_SETTINGS, difficulty: 'easy', homeCountry },
    { ...DEFAULT_HIGHER_LOWER_SETTINGS, difficulty: 'easy', homeCountry },
    { ...DEFAULT_ATLAS_SETTINGS, difficulty: 'easy', places: ['countries'] },
    { ...DEFAULT_PETIT_BAC_SETTINGS, categoryCount: 4, difficulty: 'easy' },
    { ...DEFAULT_BLACK_SQUARE_SETTINGS, difficulty: 'easy', homeCountry },
    { ...DEFAULT_THINK_ALIKE_SETTINGS, language: questionLanguageFor(locale) },
    'mostlikely',
    'reflex',
    'lights',
    { ...DEFAULT_SWATCH_SETTINGS, showMs: FAMILY_SWATCH_SHOW_MS },
    'innerclock'
  ]
}

/**
 * The seven, in the order the home page and the lobby draw them. A game named
 * bare takes what this host last left it at, or its opening settings; a
 * variant — a blind test on one source, a quiz on one subject — is spelled out.
 * Every game is answered the way it opens (`rememberedOnReadyMade`).
 * *First game* leaves out most likely: it falls flat with two players.
 * *Free-for-all* is a bit of every game nobody has to judge, with no last
 * round, and *Without borders* the same with nothing from one country.
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
    id: 'international',
    lineUp: internationalFor(locale),
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
    id: 'family',
    lineUp: familyFor(locale),
    lineUpDeals: [],
    room: FAMILY_ROOM,
    roundCount: 20,
    runningOrder: []
  },
  {
    id: 'music',
    lineUp: MUSIC_SPECIAL_OF_LOCALE[locale].map((source) =>
      blindtestOn({ locale, source })
    ),
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
      fiveCluesIn(locale),
      'timeline',
      'estimate'
    ],
    lineUpDeals: [],
    roundCount: 20,
    runningOrder: []
  },
  {
    id: 'quick',
    lineUp: ['reflex', 'lights', 'swatch', 'innerclock', 'matchsticks'],
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

/** `settings` with what `lineUp` answers of the room laid over them. */
export const withReadyMadeRoom = ({
  lineUp,
  settings
}: {
  lineUp: ReadyMadeLineUp
  settings: RoomSettings
}): RoomSettings => ({ ...settings, ...lineUp.room })

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
