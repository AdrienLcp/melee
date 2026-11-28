import { describe, expect, it } from 'vitest'

import { trackSourceSchema } from './track'

describe('trackSourceSchema', () => {
  it('[track-source] reads a source stored before the catalogue as the strands it drew', () => {
    expect(trackSourceSchema.parse({ kind: 'all' })).toEqual({
      charts: [],
      decades: [],
      hasChildrenSongs: false,
      hasClassics: false,
      hasFilmScores: true,
      kind: 'catalogue'
    })
    expect(trackSourceSchema.parse({ genreIds: [152], kind: 'chart' })).toEqual(
      {
        charts: [152],
        decades: null,
        hasChildrenSongs: false,
        hasClassics: false,
        hasFilmScores: false,
        kind: 'catalogue'
      }
    )
    expect(
      trackSourceSchema.parse({ decades: ['1980s'], kind: 'decade' })
    ).toEqual({
      charts: null,
      decades: ['1980s'],
      hasChildrenSongs: false,
      hasClassics: false,
      hasFilmScores: false,
      kind: 'catalogue'
    })
    expect(trackSourceSchema.parse({ kind: 'film' })).toEqual({
      charts: null,
      decades: null,
      hasChildrenSongs: false,
      hasClassics: false,
      hasFilmScores: true,
      kind: 'catalogue'
    })
  })

  it('[track-source] refuses a catalogue that draws from nothing', () => {
    expect(
      trackSourceSchema.safeParse({
        charts: null,
        decades: null,
        hasFilmScores: false,
        kind: 'catalogue'
      }).success
    ).toBe(false)
  })

  it('[track-source] reads a catalogue stored before the classics as drawing none of them', () => {
    expect(
      trackSourceSchema.parse({
        charts: [],
        decades: null,
        hasFilmScores: false,
        kind: 'catalogue'
      })
    ).toEqual({
      charts: [],
      decades: null,
      hasChildrenSongs: false,
      hasClassics: false,
      hasFilmScores: false,
      kind: 'catalogue'
    })
  })

  it('[track-source] takes the classics alone as a catalogue', () => {
    expect(
      trackSourceSchema.safeParse({
        charts: null,
        decades: null,
        hasClassics: true,
        hasFilmScores: false,
        kind: 'catalogue'
      }).success
    ).toBe(true)
  })

  it('[track-source] takes the children’s songs alone as a catalogue, and reads one stored before them as drawing none', () => {
    expect(
      trackSourceSchema.safeParse({
        charts: null,
        decades: null,
        hasChildrenSongs: true,
        hasFilmScores: false,
        kind: 'catalogue'
      }).success
    ).toBe(true)
    expect(
      trackSourceSchema.parse({
        charts: [],
        decades: [],
        hasFilmScores: true,
        kind: 'catalogue'
      })
    ).toMatchObject({ hasChildrenSongs: false })
  })

  it('[track-source] keeps a playlist and a search as they are', () => {
    expect(
      trackSourceSchema.parse({ kind: 'playlist', playlistId: '908622995' })
    ).toEqual({ kind: 'playlist', playlistId: '908622995' })
    expect(trackSourceSchema.parse({ kind: 'search', query: 'abba' })).toEqual({
      kind: 'search',
      query: 'abba'
    })
  })
})
