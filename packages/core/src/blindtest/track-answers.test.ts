import { describe, expect, it } from 'vitest'

import { catalogueOf, EVERY_STRAND } from '@melee/protocol/track'

import { trackAnswersOf } from './track-answers'

describe('trackAnswersOf', () => {
  it('[track-answers] asks for a film only where the film scores are all that is drawn', () => {
    expect(trackAnswersOf(catalogueOf({ hasFilmScores: true }))).toBe('films')
    expect(trackAnswersOf(EVERY_STRAND)).toBe('mixed')
    expect(
      trackAnswersOf(catalogueOf({ decades: ['1980s'], hasFilmScores: true }))
    ).toBe('mixed')
  })

  it('[track-answers] asks for a song from every source the composers are not in', () => {
    expect(trackAnswersOf(catalogueOf({ charts: [], decades: [] }))).toBe(
      'songs'
    )
    expect(trackAnswersOf({ kind: 'search', query: 'john williams' })).toBe(
      'songs'
    )
  })
})
