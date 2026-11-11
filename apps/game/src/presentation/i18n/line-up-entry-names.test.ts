import { describe, expect, it } from 'vitest'

import {
  type BlindtestSettings,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_SLATE_SETTINGS,
  DEFAULT_TIMELINE_SETTINGS,
  type QuizSettings
} from '@melee/protocol/game'
import { DEFAULT_ROOM_SETTINGS } from '@melee/protocol/room'
import {
  catalogueOf,
  EVERY_STRAND,
  type TrackSource
} from '@melee/protocol/track'

import {
  readyMadeLineUpsFor,
  savedEveningOfReadyMade
} from '@melee/core/room/ready-made-line-ups'
import { withSavedEvening } from '@melee/core/room/saved-evening'

import { i18n } from './i18n'
import {
  lineUpEntryNames,
  lineUpEntrySummaries,
  nextRoundName,
  playedRoundName
} from './line-up-entry-names'

const translate = i18n.translator('en')

const blindtest = (source: TrackSource): BlindtestSettings => ({
  ...DEFAULT_BLINDTEST_SETTINGS,
  source
})

const quiz = (categories: QuizSettings['categories']): QuizSettings => ({
  ...DEFAULT_QUIZ_SETTINGS,
  categories
})

describe('lineUpEntryNames', () => {
  it('[line-up] names a variant by its one decade, not by the kind of source', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest(catalogueOf({ decades: ['1970s'] })),
          blindtest(catalogueOf({ decades: ['1980s'] }))
        ],
        translate
      })
    ).toEqual(['Blind test · 70s', 'Blind test · 80s'])
  })

  it('[line-up] names a variant by its one genre', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest(catalogueOf({ charts: [152] })),
          blindtest(catalogueOf({ hasFilmScores: true }))
        ],
        translate
      })
    ).toEqual(['Blind test · Rock', 'Blind test · Film scores'])
  })

  it('[line-up] calls an entry with several picks by the game alone', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest(catalogueOf({ decades: ['1970s', '1990s'] })),
          blindtest(catalogueOf({ decades: ['1980s'] }))
        ],
        translate
      })
    ).toEqual(['Blind test', 'Blind test · 80s'])
  })

  it('[line-up] tells two entries nothing else sets apart by their level', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          { ...quiz(['history', 'science']), difficulty: 'easy' },
          { ...quiz(['sport', 'cinema']), difficulty: 'hard' },
          { ...DEFAULT_TIMELINE_SETTINGS, difficulty: 'easy' },
          DEFAULT_TIMELINE_SETTINGS
        ],
        translate
      })
    ).toEqual([
      'Quiz · Easy',
      'Quiz · Hard',
      'Before & after · Easy',
      'Before & after · Mixed'
    ])
  })

  it('[line-up] names a variant by its pick and then its level', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          { ...quiz(['history']), difficulty: 'easy' },
          quiz(['history'])
        ],
        translate
      })
    ).toEqual(['Quiz · History · Easy', 'Quiz · History · Mixed'])
  })

  it('[line-up] never numbers two entries nothing else tells apart', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          quiz(['history', 'science']),
          quiz(['sport', 'cinema']),
          quiz([])
        ],
        translate
      })
    ).toEqual(['Quiz', 'Quiz', 'Quiz · Every subject'])
  })

  it('[line-up] calls a catalogue mixing strands by the game alone', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest(EVERY_STRAND),
          blindtest(catalogueOf({ decades: ['1980s'], hasFilmScores: true })),
          blindtest(catalogueOf({ decades: ['1980s'] }))
        ],
        translate
      })
    ).toEqual(['Blind test', 'Blind test', 'Blind test · 80s'])
  })

  it('[line-up] says an empty decade list plays every decade', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest(catalogueOf({ decades: [] })),
          blindtest(catalogueOf({ decades: ['2000s'] }))
        ],
        translate
      })
    ).toEqual(['Blind test · Every decade', 'Blind test · 2000s'])
  })
})

it.each(['en', 'fr'] as const)(
  '[line-up] names every entry of the grand mix apart in %s',
  (locale) => {
    const grandMix = readyMadeLineUpsFor(locale).find(
      ({ id }) => id === 'grandMix'
    )

    if (grandMix === undefined) {
      throw new Error('the grand mix ships')
    }

    const { lineUp } = withSavedEvening({
      evening: savedEveningOfReadyMade({ lineUp: grandMix, name: 'grandMix' }),
      locale,
      rememberedFor: () => null,
      settings: DEFAULT_ROOM_SETTINGS
    })
    const names = lineUpEntryNames({
      lineUp,
      translate: i18n.translator(locale)
    })

    expect(new Set(names).size).toBe(names.length)
  }
)

describe('lineUpEntrySummaries', () => {
  it('[line-up] names every pick an entry holds, its round length last', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [
          blindtest(catalogueOf({ decades: ['1970s', '1980s', '1990s'] })),
          {
            ...quiz(['history', 'science', 'sport', 'cinema', 'flags']),
            language: 'en'
          }
        ],
        translate
      }).map((summary) => summary.settings)
    ).toEqual([
      '70s, 80s, 90s\u00a0· Easy\u00a0· 20s',
      'History, Science, Sport, Film and TV, Flags · Mixed · English · 30s'
    ])
  })

  it('[line-up] names every strand a catalogue draws from, and drops the level for film scores alone', () => {
    expect(
      [
        blindtest(EVERY_STRAND),
        blindtest(catalogueOf({ charts: [152, 132], hasFilmScores: true })),
        blindtest(catalogueOf({ hasFilmScores: true }))
      ].map(
        (entry) =>
          lineUpEntrySummaries({ lineUp: [entry], translate })[0]?.settings
      )
    ).toEqual([
      'Top charts + Every decade + Film scores · Easy · 20s',
      'Rock, Pop + Film scores · Easy · 20s',
      'Film scores · 20s'
    ])
  })

  it('[line-up] titles every row by its game alone', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [
          blindtest(catalogueOf({ decades: ['1970s'] })),
          quiz(['history', 'science']),
          quiz(['sport', 'cinema'])
        ],
        translate
      }).map((summary) => summary.name)
    ).toEqual(['Blind test', 'Quiz', 'Quiz'])
  })

  it('[line-up] numbers two rows of one game only when their settings read the same', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [
          DEFAULT_TIMELINE_SETTINGS,
          { ...DEFAULT_TIMELINE_SETTINGS, difficulty: 'easy' },
          DEFAULT_TIMELINE_SETTINGS
        ],
        translate
      })
    ).toEqual([
      {
        name: 'Before & after 1',
        nameAlone: 'Before & after 1',
        settings: 'Mixed · 45s'
      },
      {
        name: 'Before & after',
        nameAlone: 'Before & after · Easy',
        settings: 'Easy · 45s'
      },
      {
        name: 'Before & after 2',
        nameAlone: 'Before & after 2',
        settings: 'Mixed · 45s'
      }
    ])
  })

  it('[line-up] tells two rows of one game apart by their settings alone', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [
          { ...quiz(['history']), language: 'en' },
          { ...quiz(['geography']), language: 'en' },
          blindtest(catalogueOf({ decades: ['1980s'] })),
          blindtest(catalogueOf({ decades: ['1990s'] })),
          { ...DEFAULT_SLATE_SETTINGS, itemCount: 5 },
          { ...DEFAULT_SLATE_SETTINGS, itemCount: 10 }
        ],
        translate
      })
    ).toEqual([
      {
        name: 'Quiz',
        nameAlone: 'Quiz · History',
        settings: 'History · Mixed · English · 30s'
      },
      {
        name: 'Quiz',
        nameAlone: 'Quiz · Geography',
        settings: 'Geography · Mixed · English · 30s'
      },
      {
        name: 'Blind test',
        nameAlone: 'Blind test · 80s',
        settings: '80s · Easy · 20s'
      },
      {
        name: 'Blind test',
        nameAlone: 'Blind test · 90s',
        settings: '90s · Easy · 20s'
      },
      {
        name: 'Slate',
        nameAlone: 'Slate · 5 things to guess',
        settings: '5 things to guess'
      },
      {
        name: 'Slate',
        nameAlone: 'Slate · 10 things to guess',
        settings: '10 things to guess'
      }
    ])
  })

  it('[line-up] keeps the whole detail on an entry its game holds alone', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [{ ...quiz(['history']), language: 'en' }],
        translate
      })
    ).toEqual([
      {
        name: 'Quiz',
        nameAlone: 'Quiz',
        settings: 'History · Mixed · English · 30s'
      }
    ])
  })
})

describe('nextRoundName', () => {
  it('[line-up] says the one pick of an entry its game holds alone', () => {
    expect(
      nextRoundName({
        settings: {
          lineUp: [
            quiz(['history', 'science']),
            blindtest(catalogueOf({ decades: ['1970s'] }))
          ],
          lineUpAt: 1
        },
        translate
      })
    ).toBe('Blind test · 70s')
  })

  it('[line-up] keeps the name a sibling already asked for', () => {
    expect(
      nextRoundName({
        settings: {
          lineUp: [
            blindtest(catalogueOf({ decades: ['1970s'] })),
            blindtest(catalogueOf({ hasFilmScores: true }))
          ],
          lineUpAt: 0
        },
        translate
      })
    ).toBe('Blind test · 70s')
  })

  it('[line-up] calls an entry with several picks by the game alone', () => {
    expect(
      nextRoundName({
        settings: { lineUp: [quiz(['history', 'science'])], lineUpAt: 0 },
        translate
      })
    ).toBe('Quiz')
  })

  it('[line-up] never numbers the entry it announces', () => {
    expect(
      nextRoundName({
        settings: {
          lineUp: [quiz(['history', 'science']), quiz(['sport', 'cinema'])],
          lineUpAt: 1
        },
        translate
      })
    ).toBe('Quiz')
  })

  it('[line-up] names nothing while the line-up points at nothing', () => {
    expect(
      nextRoundName({
        settings: { lineUp: [quiz([])], lineUpAt: null },
        translate
      })
    ).toBeNull()
  })
})

describe('playedRoundName', () => {
  const lineUp = [
    quiz(['history', 'science']),
    blindtest(catalogueOf({ decades: ['1970s'] }))
  ]

  it('[line-up] names the entry the round was opened from, its pick said', () => {
    expect(
      playedRoundName({
        lineUp,
        round: { content: { kind: 'blindtest' }, lineUpAt: 1 },
        translate
      })
    ).toBe('Blind test · 70s')
  })

  it('[line-up] falls back on the game once the entry left its place', () => {
    expect(
      playedRoundName({
        lineUp,
        round: { content: { kind: 'blindtest' }, lineUpAt: 0 },
        translate
      })
    ).toBe('Blind test')
  })

  it('[line-up] never numbers the round it heads', () => {
    expect(
      playedRoundName({
        lineUp: [quiz(['history', 'science']), quiz(['sport', 'cinema'])],
        round: { content: { kind: 'quiz' }, lineUpAt: 1 },
        translate
      })
    ).toBe('Quiz')
  })

  it('[line-up] names nothing in a room of one entry', () => {
    expect(
      playedRoundName({
        lineUp: [quiz(['history'])],
        round: { content: { kind: 'quiz' }, lineUpAt: 0 },
        translate
      })
    ).toBeNull()
  })

  it('[line-up] leaves the level out of every row while the whole evening agrees on it', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [
          { ...quiz(['history']), language: 'en' },
          DEFAULT_TIMELINE_SETTINGS
        ],
        translate
      }).map((summary) => summary.settings)
    ).toEqual(['History · English · 30s', '45s'])
  })
})
