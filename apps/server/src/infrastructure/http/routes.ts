import type { Result } from '@adrienlcp/result'
import { zValidator } from '@hono/zod-validator'
import type { Context, Hono, MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'

import type {
  ApiErrorResponse,
  CreateRoomResponse,
  HealthResponse,
  OpenWallPairingResponse,
  RoomExistsResponse,
  SoundCheckResponse,
  TrackListResponse,
  WallPairingPollResponse
} from '@melee/protocol/http'
import {
  createRoomRequestSchema,
  errorReportSchema,
  pairWallRequestSchema,
  playlistPreviewQuerySchema,
  REPORT_BODY_MAX_BYTES,
  soundCheckResponseSchema,
  trackSearchQuerySchema,
  wallPairingCodeSchema,
  wallPairingPollQuerySchema
} from '@melee/protocol/http'
import { API_PREFIX, API_ROUTES, MCP_ROUTE } from '@melee/protocol/routes'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import { normalizeRoomCode } from '@melee/core/room/room-code'

import { env } from '@/env'
import { nowMs } from '@/infrastructure/clock'
import { registerAdminRoutes } from '@/infrastructure/http/admin-routes'
import { invalidInput } from '@/infrastructure/http/error-responses'
import type { RoomDoor, WallPairings } from '@/infrastructure/http/http-ports'
import {
  type RateLimiter,
  reportLimitKey
} from '@/infrastructure/http/rate-limit'
import { logger } from '@/infrastructure/logging/logger'
import { answerMcp } from '@/infrastructure/mcp/mcp-endpoint'
import {
  fetchHostTrack,
  fetchTracksFor
} from '@/infrastructure/music/deezer-client'
import {
  type CataloguePool,
  isOutage,
  type MusicSourceFailure
} from '@/infrastructure/music/music-source'
import {
  type ReportStore,
  storedClientReport
} from '@/infrastructure/reports/report-store'

/**
 * A catalogue that matched nothing well-known enough to guess is an empty
 * result, not a broken gateway — the caller renders "nothing here", and 502 is
 * reserved for the catalogue actually being down.
 */
const respondWithTracks = (
  context: Context,
  found: Result<CataloguePool, MusicSourceFailure>
) => {
  const faults =
    found.status === 'failure' ? found.error.faults : found.data.faults

  if (faults.length > 0) {
    const log = isOutage(faults) ? logger.error : logger.warn

    log(
      found.status === 'failure'
        ? 'Could not list tracks'
        : 'Listed tracks past failing catalogue paths',
      { faults, path: context.req.path }
    )
  }

  if (
    found.status === 'failure' &&
    found.error.code === 'no_content_available'
  ) {
    const empty: TrackListResponse = { tracks: [] }

    return context.json(empty)
  }

  if (found.status === 'failure') {
    const error: ApiErrorResponse = {
      code: found.error.code,
      message: 'The music catalogue is unavailable right now'
    }

    return context.json(error, 502)
  }

  const body: TrackListResponse = { tracks: found.data.tracks }

  return context.json(body)
}

const reportRefused: ApiErrorResponse = {
  code: 'invalid_input',
  message: 'A report holds only the fields its schema names'
}

const tooManyReports: ApiErrorResponse = {
  code: 'rate_limited',
  message: 'Too many reports from this room or address'
}

const parsedJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * Daft Punk's _Harder, Better, Faster, Stronger_: on Deezer since its first
 * day, ranked near the top for twenty years, and recognised in the first bar.
 */
export const SOUND_CHECK_TRACK_ID = '3135556'

const soundCheckUnavailable: ApiErrorResponse = {
  code: 'music_source_unavailable',
  message: 'The music catalogue is unavailable right now'
}

const pairingNotFound: ApiErrorResponse = {
  code: 'pairing_not_found',
  message: 'That screen code has expired or was never shown'
}

/**
 * Fifteen routes, and none of them play a game — creating a room, checking one
 * exists, browsing the catalogue, keeping a screen's error report, reading
 * those reports back on `/admin`. Everything
 * that happens while people are playing is a WebSocket frame.
 */
export const registerHttpRoutes = ({
  adminToken,
  app,
  limitRoomCreation,
  limitSoundChecks,
  reportLimiter,
  reports,
  rooms,
  walls
}: {
  /** `ADMIN_TOKEN`, which opens `/api/admin/*`; `null` keeps those routes answering 404. */
  adminToken: string | null
  app: Hono
  /** Each runtime counts by its own means: one process's memory, or the platform's binding. */
  limitRoomCreation: MiddlewareHandler
  /** Counted per address, like room creation: each check is a Deezer request. */
  limitSoundChecks: MiddlewareHandler
  /** Counted per room, or per address for a screen in none — see `reportLimitKey`. */
  reportLimiter: RateLimiter
  reports: ReportStore
  rooms: RoomDoor
  walls: WallPairings
}): void => {
  // Only reached when the browser is not behind the Vite dev proxy; in dev the
  // app and the API share an origin, so nothing here fires.
  app.use(`${API_PREFIX}/*`, cors({ origin: env.allowedOrigins }))

  // Open to every origin: it holds no credential and opens no room, and an
  // assistant may run in a browser.
  app.use(MCP_ROUTE, cors({ origin: '*' }))

  registerAdminRoutes({ adminToken, app, reports })

  app.post(MCP_ROUTE, async (context) => {
    const answer = await answerMcp({
      body: await context.req.text(),
      origin: new URL(context.req.url).origin
    })

    return answer.status === 202
      ? context.body(null, 202)
      : context.json(answer.reply, answer.status)
  })

  app.on(['GET', 'DELETE'], MCP_ROUTE, (context) =>
    context.body(null, 405, { Allow: 'POST' })
  )

  app.get(API_ROUTES.health, (context) => {
    const body: HealthResponse = {
      build: env.build,
      committedAt: env.committedAt,
      protocolVersion: PROTOCOL_VERSION,
      status: 'ok'
    }

    return context.json(body)
  })

  // Sent with `sendBeacon`, so nobody reads the answer: the body is measured
  // before it is parsed, and the limit is checked once the room is known.
  app.post(API_ROUTES.reports, async (context) => {
    const text = await context.req.text()

    if (new TextEncoder().encode(text).length > REPORT_BODY_MAX_BYTES) {
      return context.json(reportRefused, 413)
    }

    const report = errorReportSchema.safeParse(parsedJson(text))

    if (!report.success) {
      return context.json(reportRefused, 400)
    }

    const { success } = await reportLimiter.limit({
      key: reportLimitKey({
        address: context.req.header('CF-Connecting-IP'),
        roomCode: report.data.roomCode
      })
    })

    if (!success) {
      return context.json(tooManyReports, 429)
    }

    await reports.record(
      storedClientReport({
        receivedAt: nowMs(),
        report: report.data,
        serverBuild: env.build
      })
    )

    return context.body(null, 204)
  })

  app.post(
    API_ROUTES.rooms,
    limitRoomCreation,
    zValidator('json', createRoomRequestSchema, invalidInput),
    async (context) => {
      const { games, locale } = context.req.valid('json')
      const opened = await rooms.openRoom({ games, locale })

      if (opened === null) {
        const error: ApiErrorResponse = {
          code: 'internal_error',
          message: 'Could not allocate a room code'
        }

        return context.json(error, 503)
      }

      const body: CreateRoomResponse = opened

      return context.json(body, 201)
    }
  )

  app.get(API_ROUTES.room, async (context) => {
    const code = normalizeRoomCode(context.req.param('code'))
    const body: RoomExistsResponse = {
      exists: code !== null && (await rooms.roomExists(code))
    }

    return context.json(body)
  })

  // A wall asks for a code to show, the host's device vouches for it with the
  // room's token, and the wall collects the token by polling. Rate-limited with
  // room creation: a code is the same cheap allocation a room is.
  app.post(API_ROUTES.walls, limitRoomCreation, async (context) => {
    const opened = await walls.open()

    if (opened === null) {
      const error: ApiErrorResponse = {
        code: 'internal_error',
        message: 'Could not allocate a screen code'
      }

      return context.json(error, 503)
    }

    const body: OpenWallPairingResponse = opened

    return context.json(body, 201)
  })

  app.get(
    API_ROUTES.wall,
    zValidator('query', wallPairingPollQuerySchema, invalidInput),
    async (context) => {
      const pairingCode = wallPairingCodeSchema.safeParse(
        context.req.param('pairingCode')
      )

      if (!pairingCode.success) {
        return context.json(pairingNotFound, 404)
      }

      const collected = await walls.collect({
        pairingCode: pairingCode.data,
        secret: context.req.valid('query').secret
      })

      if (collected.status === 'failure') {
        return context.json(pairingNotFound, 404)
      }

      const body: WallPairingPollResponse = collected.data

      return context.json(body)
    }
  )

  app.post(
    API_ROUTES.wallPair,
    zValidator('json', pairWallRequestSchema, invalidInput),
    async (context) => {
      const pairingCode = wallPairingCodeSchema.safeParse(
        context.req.param('pairingCode')
      )

      if (!pairingCode.success) {
        return context.json(pairingNotFound, 404)
      }

      const { hostToken, roomCode } = context.req.valid('json')

      if (!(await rooms.isHostedWith({ code: roomCode, hostToken }))) {
        const error: ApiErrorResponse = {
          code: 'wall_not_paired',
          message: 'Only the device hosting this room can pair a screen to it'
        }

        return context.json(error, 403)
      }

      const paired = await walls.pair({
        hostToken,
        pairingCode: pairingCode.data,
        roomCode
      })

      if (paired.status === 'failure') {
        return context.json(pairingNotFound, 404)
      }

      return context.body(null, 204)
    }
  )

  app.get(API_ROUTES.soundCheck, limitSoundChecks, async (context) => {
    const sample = await fetchHostTrack(
      SOUND_CHECK_TRACK_ID,
      context.req.raw.signal
    )

    if (sample.status === 'failure') {
      const log = isOutage(sample.error.faults) ? logger.error : logger.warn

      log('Could not resolve the sound check sample', {
        faults: sample.error.faults,
        path: context.req.path
      })

      return context.json(soundCheckUnavailable, 502)
    }

    const body = soundCheckResponseSchema.safeParse({
      previewUrl: sample.data.previewUrl
    })

    if (!body.success) {
      logger.error('The sound check sample is served from an unknown host', {
        path: context.req.path,
        previewUrl: sample.data.previewUrl
      })

      return context.json(soundCheckUnavailable, 502)
    }

    const answered: SoundCheckResponse = body.data

    return context.json(answered)
  })

  app.get(
    API_ROUTES.trackSearch,
    zValidator('query', trackSearchQuerySchema, invalidInput),
    async (context) => {
      const { difficulty, q } = context.req.valid('query')
      const found = await fetchTracksFor({
        difficulty,
        signal: context.req.raw.signal,
        source: { kind: 'search', query: q }
      })

      return respondWithTracks(context, found)
    }
  )

  // A playlist id is copied out of a Deezer URL, so the host has no way of
  // knowing they pasted the wrong one until the first round comes up empty.
  app.get(
    API_ROUTES.playlistTracks,
    zValidator('query', playlistPreviewQuerySchema, invalidInput),
    async (context) => {
      const { difficulty } = context.req.valid('query')
      const found = await fetchTracksFor({
        difficulty,
        signal: context.req.raw.signal,
        source: {
          kind: 'playlist',
          playlistId: context.req.param('playlistId')
        }
      })

      return respondWithTracks(context, found)
    }
  )
}
