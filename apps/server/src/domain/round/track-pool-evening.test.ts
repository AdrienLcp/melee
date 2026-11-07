import { Result } from '@adrienlcp/result'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_BLINDTEST_SETTINGS } from '@melee/protocol/game'
import type { CatalogueTrack } from '@melee/protocol/http'
import { EVERY_STRAND } from '@melee/protocol/track'

import { generateHostToken } from '@melee/core/room/host-token'

import { newRoom } from '@/domain/room/new-room'

import { drawPlayableTrack } from './track-pool'

/**
 * One composer whose whole catalogue is a single work, the shape that served
 * *The Last of Us* round after round, beside twenty artists of two songs each.
 */
const CATALOGUE: CatalogueTrack[] = [
  ...Array.from({ length: 10 }, (_, index) => ({
    artist: 'Gustavo Santaolalla',
    coverUrl: null,
    film: 'The Last of Us',
    id: `last-of-us-${index}`,
    title: `Cue ${index}`
  })),
  ...Array.from({ length: 60 }, (_, index) => ({
    artist: `Artist ${index % 20}`,
    coverUrl: null,
    film: null,
    id: `song-${index}`,
    title: `Song ${index}`
  }))
]

vi.mock('@/infrastructure/music/deezer-client', () => ({
  fetchHostTrack: async (trackId: string) => {
    const track = CATALOGUE.find((candidate) => candidate.id === trackId)

    return track === undefined
      ? Result.failure({ code: 'no_content_available', faults: [] })
      : Result.success({ ...track, previewUrl: 'https://example.test/p.mp3' })
  },
  fetchTracksFor: async () =>
    Result.success({ faults: [], tracks: [...CATALOGUE] })
}))

const ROUNDS_IN_AN_EVENING = 30

describe('an evening of the curated catalogue', () => {
  it('[pool] opens no work twice and no artist a third time over thirty rounds', async () => {
    const room = newRoom({
      code: 'ABCD',
      games: ['blindtest'],
      hostToken: generateHostToken(),
      locale: 'en',
      now: 0
    })
    const settings = { ...DEFAULT_BLINDTEST_SETTINGS, source: EVERY_STRAND }
    const works: string[] = []
    const artists: string[] = []

    for (let round = 0; round < ROUNDS_IN_AN_EVENING; round++) {
      const drawn = await drawPlayableTrack({ room, settings })

      if (drawn.status === 'failure') {
        throw new Error(`round ${round} found nothing: ${drawn.error.code}`)
      }

      works.push(drawn.data.track.film ?? drawn.data.track.title)
      artists.push(drawn.data.track.artist)
    }

    expect(new Set(works).size).toBe(ROUNDS_IN_AN_EVENING)
    expect(
      Math.max(
        ...new Set(artists)
          .values()
          .map((artist) => artists.filter((one) => one === artist).length)
      )
    ).toBeLessThanOrEqual(2)
  })
})
