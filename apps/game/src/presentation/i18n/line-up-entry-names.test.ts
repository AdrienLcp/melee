import { describe, expect, it } from 'vitest'

import {
  type BlindtestSettings,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
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
  nextRoundName
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
      lineUpEntrySummaries({
        lineUp: [
          blindtest(EVERY_STRAND),
          blindtest(catalogueOf({ charts: [152, 132], hasFilmScores: true })),
          blindtest(catalogueOf({ hasFilmScores: true }))
        ],
        translate
      }).map((summary) => summary.settings)
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
