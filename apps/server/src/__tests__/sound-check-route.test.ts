import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  apiErrorResponseSchema,
  soundCheckResponseSchema
} from '@melee/protocol/http'
import { API_ROUTES } from '@melee/protocol/routes'

import { SOUND_CHECK_TRACK_ID } from '@/infrastructure/http/routes'
import { fetchHostTrack } from '@/infrastructure/music/deezer-client'
import {
  createApp,
  SOUND_CHECKS_BEFORE_RATE_LIMIT
} from '@/infrastructure/node/node-app'

import { CATALOGUE } from './room-harness'

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const FRESH_PREVIEW =
  'https://cdnt-preview.dzcdn.net/api/1/1/a/b/c/0/abc.mp3?hdnea=exp=1'

const [SAMPLE_TRACK] = CATALOGUE

const answerWith = (previewUrl: string) => {
  if (SAMPLE_TRACK === undefined) {
    throw new Error('the catalogue fixture is empty')
  }

  vi.mocked(fetchHostTrack).mockResolvedValue({
    data: { ...SAMPLE_TRACK, previewUrl },
    status: 'success'
  })
}

describe('the sound check route', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('[sound-check] hands over a preview resolved as it is asked for', async () => {
    answerWith(FRESH_PREVIEW)
    const { app } = createApp()

    const response = await app.request(API_ROUTES.soundCheck)

    expect(response.status).toBe(200)
    expect(soundCheckResponseSchema.parse(await response.json())).toEqual({
      previewUrl: FRESH_PREVIEW
    })
    expect(fetchHostTrack).toHaveBeenLastCalledWith(
      SOUND_CHECK_TRACK_ID,
      expect.any(AbortSignal)
    )
  })

  it('[sound-check] answers music_source_unavailable when Deezer fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(fetchHostTrack).mockResolvedValue({
      error: {
        code: 'music_source_unavailable',
        faults: [{ detail: '503', kind: 'http_error', path: '/track/3135556' }]
      },
      status: 'failure'
    })
    const { app } = createApp()

    const response = await app.request(API_ROUTES.soundCheck)

    expect(response.status).toBe(502)
    expect(apiErrorResponseSchema.parse(await response.json()).code).toBe(
      'music_source_unavailable'
    )
  })

  it('[sound-check] never relays an address off Deezer’s preview host', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    answerWith('https://elsewhere.example/sample.mp3')
    const { app } = createApp()

    const response = await app.request(API_ROUTES.soundCheck)

    expect(response.status).toBe(502)
  })

  it('[rate-limit] stops one address from draining the Deezer quota', async () => {
    answerWith(FRESH_PREVIEW)
    const { app } = createApp()
    const statuses: number[] = []

    for (
      let attempt = 0;
      attempt <= SOUND_CHECKS_BEFORE_RATE_LIMIT;
      attempt++
    ) {
      statuses.push((await app.request(API_ROUTES.soundCheck)).status)
    }

    expect(statuses.filter((status) => status === 200)).toHaveLength(
      SOUND_CHECKS_BEFORE_RATE_LIMIT
    )
    expect(statuses.at(-1)).toBe(429)
  })
})
