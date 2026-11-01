import {
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
  locale
}: {
  categories: typeof DEFAULT_QUIZ_SETTINGS.categories
  locale: Locale
}): SavedEntry => ({
  ...DEFAULT_QUIZ_SETTINGS,
  categories,
  language: questionLanguageFor(locale)
})

/**
 * The four, in the order the home page and the lobby draw them. A game named
 * bare takes what this host last left it at, or its opening settings; a
 * variant — a blind test on one source, a quiz on one subject — is spelled out.
 * *First game* leaves out most likely: it falls flat with two players.
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
        categories: [
          'history',
          'geography',
          'science',
          'arts',
          'cinema',
          'sport',
          'everyday'
        ],
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
