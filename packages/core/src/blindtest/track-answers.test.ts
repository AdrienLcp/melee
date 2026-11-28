import { describe, expect, it } from 'vitest'

import { catalogueOf, EVERY_STRAND } from '@melee/protocol/track'

import { pinsItsOwnFloor, trackAnswersOf } from './track-answers'

describe('trackAnswersOf', () => {
  it('[track-answers] asks for a film only where the film scores are all that is drawn', () => {
    expect(trackAnswersOf(catalogueOf({ hasFilmScores: true }))).toBe('films')
    expect(trackAnswersOf(EVERY_STRAND)).toBe('mixed')
    expect(
      trackAnswersOf(catalogueOf({ decades: ['1980s'], hasFilmScores: true }))
    ).toBe('mixed')
    expect(
      trackAnswersOf(catalogueOf({ hasClassics: true, hasFilmScores: true }))
    ).toBe('mixed')
  })

  it('[track-answers] reads the children’s songs as a mix, films’ songs beside nursery rhymes', () => {
    expect(trackAnswersOf(catalogueOf({ hasChildrenSongs: true }))).toBe(
      'mixed'
    )
    expect(pinsItsOwnFloor(catalogueOf({ hasChildrenSongs: true }))).toBe(true)
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

describe('pinsItsOwnFloor', () => {
  it('[track-answers] leaves the level to the host wherever a chart or a decade is drawn', () => {
    expect(pinsItsOwnFloor(EVERY_STRAND)).toBe(false)
    expect(
      pinsItsOwnFloor(catalogueOf({ decades: ['1990s'], hasClassics: true }))
    ).toBe(false)
    expect(pinsItsOwnFloor({ kind: 'playlist', playlistId: '42' })).toBe(false)
  })

  it('[track-answers] pins the level for the classics and the film scores alone', () => {
    expect(pinsItsOwnFloor(catalogueOf({ hasClassics: true }))).toBe(true)
    expect(pinsItsOwnFloor(catalogueOf({ hasFilmScores: true }))).toBe(true)
    expect(
      pinsItsOwnFloor(catalogueOf({ hasClassics: true, hasFilmScores: true }))
    ).toBe(true)
  })
})
