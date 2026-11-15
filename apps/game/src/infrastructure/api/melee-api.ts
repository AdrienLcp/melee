import { Result } from '@adrienlcp/result'
import type { z } from 'zod'

import {
  type AdminLiveRoomsResponse,
  type AdminReportResponse,
  type AdminReportsQuery,
  type AdminReportsResponse,
  adminLiveRoomsResponseSchema,
  adminReportResponseSchema,
  adminReportsResponseSchema
} from '@melee/protocol/admin'
import type { Difficulty } from '@melee/protocol/difficulty'
import type { ShelvedGame } from '@melee/protocol/game'
import {
  type BugReport,
  type CatalogueTrack,
  type CreateRoomRequest,
  type CreateRoomResponse,
  createRoomResponseSchema,
  type ErrorReport,
  type HealthResponse,
  healthResponseSchema,
  type OpenWallPairingResponse,
  openWallPairingResponseSchema,
  type PairWallRequest,
  type PlaylistPreviewQuery,
  roomExistsResponseSchema,
  type SoundCheckResponse,
  soundCheckResponseSchema,
  type TrackSearchQuery,
  trackListResponseSchema,
  type WallPairingCode,
  type WallPairingPollQuery,
  type WallPairingPollResponse,
  wallPairingPollResponseSchema
} from '@melee/protocol/http'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { Locale } from '@melee/protocol/locale'
import { API_ROUTES, fillRoute } from '@melee/protocol/routes'

/** A failure the user is told about, through `apiErrorKey`. */
export type ApiError =
  | 'unreachable'
  | 'unexpected_response'
  | 'rejected'
  | 'rate_limited'

/**
 * `aborted` is the caller's own signal answering, so it is kept out of
 * `ApiError`: a superseded request is dropped without a word, and rendering it
 * would blame the network for a request nobody wanted any more.
 */
export type ApiFailure = ApiError | 'aborted'

type Cancellable = {
  /** Aborts the request, which then fails with `aborted`. */
  signal?: AbortSignal
}

const TOO_MANY_REQUESTS = 429

/**
 * Fire and forget: `sendBeacon` survives the page unloading under it, which is
 * when an error screen's tab is closed; `fetch` with `keepalive` stands in on a
 * browser that refuses the beacon. Nobody reads the answer.
 */
export const sendErrorReport = (report: ErrorReport): void => {
  const body = JSON.stringify(report)

  if (
    navigator.sendBeacon?.(
      API_ROUTES.reports,
      new Blob([body], { type: 'application/json' })
    )
  ) {
    return
  }

  void fetch(API_ROUTES.reports, {
    body,
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    method: 'POST'
  }).catch(() => undefined)
}

/**
 * A report somebody pressed _Send_ on, so unlike an error report it is
 * awaited: the menu says it went, or offers to send it again.
 */
export const sendBugReport = async (
  report: BugReport
): Promise<Result<void, ApiError>> => {
  try {
    const response = await fetch(API_ROUTES.bugReports, {
      body: JSON.stringify(report),
      headers: { 'content-type': 'application/json' },
      method: 'POST'
    })

    if (response.status === TOO_MANY_REQUESTS) {
      return Result.failure('rate_limited')
    }

    return response.ok ? Result.success() : Result.failure('rejected')
  } catch {
    return Result.failure('unreachable')
  }
}

/**
 * The whole HTTP surface of the app. Everything that happens during a game goes
 * through the socket instead — see `infrastructure/messaging`.
 */
export const createRoom = async ({
  games,
  locale,
  signal
}: Cancellable & {
  /** The games ticked: none opens a room on nothing chosen, several a line-up. */
  games: readonly ShelvedGame[]
  /** What the host reads, which is what a quiz opens on until they say otherwise. */
  locale: Locale
}): Promise<Result<CreateRoomResponse, ApiFailure>> =>
  request(API_ROUTES.rooms, createRoomResponseSchema, {
    body: JSON.stringify({
      games: [...games],
      locale
    } satisfies CreateRoomRequest),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    signal
  })

export const fetchHealth = async ({
  signal
}: Cancellable = {}): Promise<Result<HealthResponse, ApiFailure>> =>
  request(API_ROUTES.health, healthResponseSchema, { signal })

/** A sample the console plays to check the room hears it, signed afresh. */
export const fetchSoundCheck = async ({
  signal
}: Cancellable = {}): Promise<Result<SoundCheckResponse, ApiFailure>> =>
  request(API_ROUTES.soundCheck, soundCheckResponseSchema, { signal })

type AdminRequest = Cancellable & {
  /** `ADMIN_TOKEN`; a wrong one fails with `rejected`, as the server answers 404. */
  adminKey: string
}

const asAdmin = ({ adminKey, signal }: AdminRequest): RequestInit => ({
  headers: { Authorization: `Bearer ${adminKey}` },
  signal
})

export const fetchAdminRooms = async (
  admin: AdminRequest
): Promise<Result<AdminLiveRoomsResponse, ApiFailure>> =>
  request(API_ROUTES.adminRooms, adminLiveRoomsResponseSchema, asAdmin(admin))

export const fetchAdminReports = async ({
  query,
  ...admin
}: AdminRequest & {
  query: Partial<AdminReportsQuery>
}): Promise<Result<AdminReportsResponse, ApiFailure>> =>
  request(
    withQuery(
      API_ROUTES.adminReports,
      Object.fromEntries(
        Object.entries(query)
          .filter(([, value]) => value !== undefined)
          .map(([name, value]) => [name, String(value)])
      )
    ),
    adminReportsResponseSchema,
    asAdmin(admin)
  )

export const fetchAdminReport = async ({
  id,
  ...admin
}: AdminRequest & { id: number }): Promise<
  Result<AdminReportResponse, ApiFailure>
> =>
  request(
    fillRoute(API_ROUTES.adminReport, { id: String(id) }),
    adminReportResponseSchema,
    asAdmin(admin)
  )

export const roomExists = async ({
  code,
  signal
}: Cancellable & { code: RoomCode }): Promise<Result<boolean, ApiFailure>> => {
  const answer = await request(
    fillRoute(API_ROUTES.room, { code }),
    roomExistsResponseSchema,
    { signal }
  )

  return answer.status === 'failure'
    ? answer
    : Result.success(answer.data.exists)
}

export const openWallPairing = async ({
  signal
}: Cancellable = {}): Promise<Result<OpenWallPairingResponse, ApiFailure>> =>
  request(API_ROUTES.walls, openWallPairingResponseSchema, {
    method: 'POST',
    signal
  })

export const pollWallPairing = async ({
  pairingCode,
  secret,
  signal
}: Cancellable & {
  pairingCode: WallPairingCode
  secret: string
}): Promise<Result<WallPairingPollResponse, ApiFailure>> =>
  request(
    withQuery(fillRoute(API_ROUTES.wall, { pairingCode }), {
      secret
    } satisfies WallPairingPollQuery),
    wallPairingPollResponseSchema,
    { signal }
  )

/** Answers nothing on success, so there is no body to parse. */
export const pairWall = async ({
  pairingCode,
  signal,
  ...body
}: Cancellable & PairWallRequest & { pairingCode: WallPairingCode }): Promise<
  Result<void, ApiFailure>
> => {
  try {
    const response = await fetch(
      fillRoute(API_ROUTES.wallPair, { pairingCode }),
      {
        body: JSON.stringify(body satisfies PairWallRequest),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        signal
      }
    )

    return response.ok ? Result.success() : Result.failure('rejected')
  } catch {
    return Result.failure(signal?.aborted ? 'aborted' : 'unreachable')
  }
}

export const fetchPlaylistTracks = async ({
  difficulty,
  playlistId,
  signal
}: Cancellable & {
  difficulty: Difficulty
  playlistId: string
}): Promise<Result<CatalogueTrack[], ApiFailure>> =>
  requestTracks(
    withQuery(fillRoute(API_ROUTES.playlistTracks, { playlistId }), {
      difficulty
    } satisfies PlaylistPreviewQuery),
    signal
  )

export const searchTracks = async ({
  difficulty,
  query,
  signal
}: Cancellable & {
  difficulty: Difficulty
  query: string
}): Promise<Result<CatalogueTrack[], ApiFailure>> =>
  requestTracks(
    withQuery(API_ROUTES.trackSearch, {
      difficulty,
      q: query
    } satisfies TrackSearchQuery),
    signal
  )

const requestTracks = async (
  path: string,
  signal: AbortSignal | undefined
): Promise<Result<CatalogueTrack[], ApiFailure>> => {
  const trackList = await request(path, trackListResponseSchema, { signal })

  return trackList.status === 'failure'
    ? trackList
    : Result.success(trackList.data.tracks)
}

const withQuery = (
  path: string,
  query: Readonly<Record<string, string>>
): string => `${path}?${new URLSearchParams(query)}`

/**
 * Responses are validated against the same schemas the server builds them from,
 * so a contract drift surfaces here rather than as `undefined` three components
 * deep.
 */
const request = async <TData>(
  path: string,
  schema: z.ZodType<TData>,
  init?: RequestInit
): Promise<Result<TData, ApiFailure>> => {
  let response: Response

  try {
    response = await fetch(path, init)
  } catch {
    return Result.failure(init?.signal?.aborted ? 'aborted' : 'unreachable')
  }

  // Told apart from a plain refusal because it is the one the caller can act
  // on: "wait a moment" is advice, "the server refused that" is not.
  if (response.status === TOO_MANY_REQUESTS) {
    return Result.failure('rate_limited')
  }

  if (!response.ok) {
    return Result.failure('rejected')
  }

  // A 200 is not a promise of JSON. A host waking a sleeping instance answers
  // the first request with its own HTML holding page, and parsing that used to
  // throw past this function into whatever was awaiting it.
  let body: unknown

  try {
    body = await response.json()
  } catch {
    return Result.failure(
      init?.signal?.aborted ? 'aborted' : 'unexpected_response'
    )
  }

  const parsed = schema.safeParse(body)

  return parsed.success
    ? Result.success(parsed.data)
    : Result.failure('unexpected_response')
}
