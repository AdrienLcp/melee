import { describe, expect, it } from 'vitest'

import {
  type BlindtestSettings,
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_QUIZ_SETTINGS,
  type QuizSettings
} from '@melee/protocol/game'
import type { TrackSource } from '@melee/protocol/track'

import { i18n } from './i18n'
import { lineUpEntryNames, lineUpEntrySummaries } from './line-up-entry-names'

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
          blindtest({ decades: ['1970s'], kind: 'decade' }),
          blindtest({ decades: ['1980s'], kind: 'decade' })
        ],
        translate
      })
    ).toEqual(['Blind test · 70s', 'Blind test · 80s'])
  })

  it('[line-up] names a variant by its one genre', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest({ genreIds: [152], kind: 'chart' }),
          blindtest({ kind: 'film' })
        ],
        translate
      })
    ).toEqual(['Blind test · Rock', 'Blind test · Film scores'])
  })

  it('[line-up] calls an entry with several picks by the game alone', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest({ decades: ['1970s', '1990s'], kind: 'decade' }),
          blindtest({ decades: ['1980s'], kind: 'decade' })
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

  it('[line-up] says an empty decade list plays every decade', () => {
    expect(
      lineUpEntryNames({
        lineUp: [
          blindtest({ decades: [], kind: 'decade' }),
          blindtest({ decades: ['2000s'], kind: 'decade' })
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
          blindtest({ decades: ['1970s', '1980s', '1990s'], kind: 'decade' }),
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
})
