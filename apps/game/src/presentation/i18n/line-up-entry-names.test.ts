import { describe, expect, it } from 'vitest'

import {
  type BlindtestSettings,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_SLATE_SETTINGS,
  type QuizSettings
} from '@melee/protocol/game'
import {
  catalogueOf,
  EVERY_STRAND,
  type TrackSource
} from '@melee/protocol/track'

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

  it('[line-up] numbers two entries with several picks each', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          quiz(['history', 'science']),
          quiz(['sport', 'cinema']),
          quiz([])
        ],
        translate
      })
    ).toEqual(['Quiz 1', 'Quiz 2', 'Quiz · Every subject'])
  })

  it('[line-up] counts only the entries nothing else tells apart', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest(catalogueOf({ decades: ['1970s'] })),
          blindtest(catalogueOf({ decades: ['1980s', '1990s'] })),
          blindtest(catalogueOf({ charts: [152] })),
          blindtest(catalogueOf({ charts: [132, 116] }))
        ],
        translate
      })
    ).toEqual([
      'Blind test · 70s',
      'Blind test 1',
      'Blind test · Rock',
      'Blind test 2'
    ])
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
    ).toEqual(['Blind test 1', 'Blind test 2', 'Blind test · 80s'])
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
      '70s, 80s, 90s\u00a0· Crowd-pleasers\u00a0· 20s',
      'History, Science, Sport, Cinema, Flags\u00a0· English\u00a0· 30s'
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
      'Top charts + Every decade + Film scores · Crowd-pleasers · 20s',
      'Rock, Pop + Film scores · Crowd-pleasers · 20s',
      'Film scores · 20s'
    ])
  })

  it('[line-up] titles a row by the name the line-up gives it', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [
          blindtest(catalogueOf({ decades: ['1970s'] })),
          quiz(['history', 'science']),
          quiz(['sport', 'cinema'])
        ],
        translate
      }).map((summary) => summary.name)
    ).toEqual(['Blind test', 'Quiz 1', 'Quiz 2'])
  })

  it('[line-up] leaves out of a row’s detail what its name already says', () => {
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
      { name: 'Quiz · History', settings: 'English · 30s' },
      { name: 'Quiz · Geography', settings: 'English · 30s' },
      { name: 'Blind test · 80s', settings: 'Crowd-pleasers · 20s' },
      { name: 'Blind test · 90s', settings: 'Crowd-pleasers · 20s' },
      { name: 'Slate · 5 things to guess', settings: null },
      { name: 'Slate · 10 things to guess', settings: null }
    ])
  })

  it('[line-up] keeps the whole detail on an entry its game holds alone', () => {
    expect(
      lineUpEntrySummaries({
        lineUp: [{ ...quiz(['history']), language: 'en' }],
        translate
      })
    ).toEqual([{ name: 'Quiz', settings: 'History · English · 30s' }])
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

  it('[line-up] names nothing in a room of one entry', () => {
    expect(
      playedRoundName({
        lineUp: [quiz(['history'])],
        round: { content: { kind: 'quiz' }, lineUpAt: 0 },
        translate
      })
    ).toBeNull()
  })
})
