import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  type GameSettings
} from '@melee/protocol/game'
import {
  catalogueOf,
  EVERY_STRAND,
  type TrackSource
} from '@melee/protocol/track'

import { generateHostToken } from '@melee/core/room/host-token'

import { newRoom } from '@/domain/room/new-room'

import { discardPoolIfStale, drawChoices } from './track-pool'

const playingFrom = (source: TrackSource): GameSettings => ({
  ...DEFAULT_BLINDTEST_SETTINGS,
  source
})

/**
 * Whether the pool a room was already holding survives the settings frame that
 * moved it from one game to another.
 */
const poolSurvives = ({
  from,
  to
}: {
  from: GameSettings | null
  to: GameSettings | null
}): boolean => {
  const room = newRoom({
    code: 'ABCD',
    games: ['blindtest'],
    hostToken: generateHostToken(),
    locale: 'en',
    now: 0
  })

  room.settings.game = to
  room.trackPool = [
    {
      artist: 'Daft Punk',
      coverUrl: null,
      film: null,
      id: '1',
      title: 'One More Time'
    }
  ]

  discardPoolIfStale({ previousGame: from, room })

  return room.trackPool.length > 0
}

describe('discardPoolIfStale', () => {
  it('[pool] drops what a genre change no longer asks for', () => {
    expect(
      poolSurvives({
        from: playingFrom(catalogueOf({ charts: [132] })),
        to: playingFrom(catalogueOf({ charts: [152] }))
      })
    ).toBe(false)
  })

  it('[pool] drops what a decade change no longer asks for', () => {
    expect(
      poolSurvives({
        from: playingFrom(catalogueOf({ decades: ['1990s'] })),
        to: playingFrom(catalogueOf({ decades: ['1980s'] }))
      })
    ).toBe(false)
  })

  it('[pool] keeps a pool whose selection only changed order', () => {
    expect(
      poolSurvives({
        from: playingFrom(catalogueOf({ charts: [132, 152] })),
        to: playingFrom(catalogueOf({ charts: [152, 132] }))
      })
    ).toBe(true)
  })

  it('[pool] keeps a pool nobody has touched the source of', () => {
    expect(
      poolSurvives({
        from: playingFrom(EVERY_STRAND),
        to: playingFrom(EVERY_STRAND)
      })
    ).toBe(true)
  })

  it('[pool] drops what a strand ticked or unticked no longer asks for', () => {
    expect(
      poolSurvives({
        from: playingFrom(catalogueOf({ decades: ['1990s'] })),
        to: playingFrom(
          catalogueOf({ decades: ['1990s'], hasFilmScores: true })
        )
      })
    ).toBe(false)
    expect(
      poolSurvives({
        from: playingFrom(EVERY_STRAND),
        to: playingFrom(catalogueOf({ charts: [], hasFilmScores: true }))
      })
    ).toBe(false)
  })

  // Empty is the whole strand and `null` none of it: two ways of saying the
  // opposite, and an empty list read as an absent one would keep the wrong pool.
  it('[pool] tells every decade from no decade at all', () => {
    expect(
      poolSurvives({
        from: playingFrom(catalogueOf({ charts: [], decades: [] })),
        to: playingFrom(catalogueOf({ charts: [] }))
      })
    ).toBe(false)
  })

  it('[pool] drops the pool a room left the blind test holding', () => {
    expect(
      poolSurvives({
        from: playingFrom(catalogueOf({ charts: [] })),
        to: null
      })
    ).toBe(false)
  })
})

const catalogueTrack = ({ film, id }: { film: string | null; id: string }) => ({
  artist: 'Someone',
  coverUrl: null,
  film,
  id,
  title: `Track ${id}`
})

const roomHolding = (pool: ReturnType<typeof catalogueTrack>[]) => {
  const room = newRoom({
    code: 'ABCD',
    games: ['blindtest'],
    hostToken: generateHostToken(),
    locale: 'en',
    now: 0
  })

  room.trackPool = pool

  return room
}

describe('drawChoices', () => {
  const songs = ['s1', 's2', 's3', 's4'].map((id) =>
    catalogueTrack({ film: null, id })
  )
  const cues = ['f1', 'f2', 'f3', 'f4'].map((id) =>
    catalogueTrack({ film: `Film ${id}`, id })
  )

  it('[choices] deals a score cue among score cues in a mixed pool', () => {
    const room = roomHolding([...songs, ...cues])
    const { choices } = drawChoices({
      room,
      track: {
        ...catalogueTrack({ film: 'Dune', id: 'f0' }),
        previewUrl: 'https://example.test/p.mp3'
      }
    })

    expect(choices.every((choice) => choice.film !== null)).toBe(true)
  })

  it('[choices] deals a song among songs in a mixed pool', () => {
    const room = roomHolding([...songs, ...cues])
    const { choices } = drawChoices({
      room,
      track: {
        ...catalogueTrack({ film: null, id: 's0' }),
        previewUrl: 'https://example.test/p.mp3'
      }
    })

    expect(choices.every((choice) => choice.film === null)).toBe(true)
  })

  it('[choices] still deals four when its own kind runs short', () => {
    const room = roomHolding([
      ...songs,
      catalogueTrack({ film: 'Interstellar', id: 'f1' })
    ])
    const { choices } = drawChoices({
      room,
      track: {
        ...catalogueTrack({ film: 'Dune', id: 'f0' }),
        previewUrl: 'https://example.test/p.mp3'
      }
    })

    expect(choices).toHaveLength(4)
  })
})

describe('drawChoices, read aloud', () => {
  it('[choices] never deals two buttons that read the same', () => {
    const sameFilm = ['f1', 'f2', 'f3', 'f4'].map((id) => ({
      ...catalogueTrack({ film: 'Interstellar', id }),
      artist: 'Hans Zimmer'
    }))
    const room = roomHolding([
      ...sameFilm,
      ...['g1', 'g2', 'g3'].map((id) =>
        catalogueTrack({ film: `Film ${id}`, id })
      )
    ])
    const { choices } = drawChoices({
      room,
      track: {
        ...catalogueTrack({ film: 'Interstellar', id: 'f0' }),
        artist: 'Hans Zimmer',
        previewUrl: 'https://example.test/p.mp3'
      }
    })
    const readings = choices.map((choice) => `${choice.film}/${choice.artist}`)

    expect(new Set(readings).size).toBe(4)
  })
})

describe('drawChoices, over an evening', () => {
  const answer = {
    ...catalogueTrack({ film: 'The Last of Us', id: 'last-of-us-game' }),
    previewUrl: 'https://example.test/p.mp3'
  }

  it('[choices] never offers the round’s own work under another release', () => {
    const room = roomHolding([
      {
        ...catalogueTrack({ film: 'The Last of Us', id: 'last-of-us-series' }),
        artist: 'Gustavo Santaolalla & David Fleming'
      },
      ...['f1', 'f2', 'f3'].map((id) =>
        catalogueTrack({ film: `Film ${id}`, id })
      )
    ])

    const { choices } = drawChoices({ room, track: answer })

    expect(choices.map((choice) => choice.id).toSorted()).toEqual([
      'f1',
      'f2',
      'f3',
      'last-of-us-game'
    ])
  })

  it('[choices] reaches for a decoy the evening has not offered yet', () => {
    const room = roomHolding(
      ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map((id) =>
        catalogueTrack({ film: `Film ${id}`, id })
      )
    )

    const first = drawChoices({ room, track: answer })
    const second = drawChoices({ room, track: answer })
    const offeredTwice = first.choices.filter(
      (choice) =>
        choice.id !== answer.id &&
        second.choices.some((again) => again.id === choice.id)
    )

    expect(offeredTwice).toEqual([])
  })
})
