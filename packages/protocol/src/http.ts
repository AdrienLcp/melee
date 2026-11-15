import { z } from 'zod'

import { clientMessageSchema } from './client-message'
import { protocolErrorCodeSchema } from './error-code'
import { gameKindSchema, shelvedGameSchema, shelvedGames } from './game'
import {
  hostTokenSchema,
  ROOM_CODE_ALPHABET,
  roomCodeSchema
} from './identifiers'
import { DEFAULT_LOCALE, localeSchema } from './locale'
import { roomPhaseSchema } from './room'
import {
  hostServerMessageSchema,
  playerServerMessageSchema,
  wallServerMessageSchema
} from './server-message'
import { clipFaultSchema, soundCheckUrlSchema } from './sound'
import { trackDifficultySchema, trackIdentitySchema } from './track'

/**
 * The HTTP surface is deliberately tiny — create a room, check one exists,
 * browse music — because everything that happens *during* a game is a
 * WebSocket frame. It lives here, next to the socket contract, rather than
 * being inferred from the Hono router: keeping one answer to "where is the wire
 * contract?" is worth more than the handful of lines `hc<AppType>` would save,
 * and it keeps `apps/game` from depending on `apps/server`.
 */
/**
 * The room comes first and the games second: a code goes up, the players
 * arrive, and the table decides while they do. So `games` may be **empty** —
 * the front door with nothing ticked — one game plays that game as its own
 * page opens it, and several open a line-up on the first. Teams, board and
 * judge never travel here: they are the host's, laid over the room by the
 * console's first settings frame.
 *
 * Each stays a `ShelvedGame` when it is sent. A game can be served in full
 * before it has screens, and a room opened on one of those would render
 * another game's round.
 */
export const createRoomRequestSchema = z.object({
  games: z
    .array(shelvedGameSchema)
    .max(shelvedGames.length)
    .refine((games) => new Set(games).size === games.length, {
      message: 'A game is ticked once'
    })
    .default([]),
  /**
   * The host's interface language, and the only thing a room can go on for a
   * setting nobody has been asked about yet — the quiz has to be drawn in *some*
   * language before the console has rendered. It is the shell's fact rather than
   * that game's: what the host reads, not what the room plays.
   *
   * Defaulted rather than required, because this door has no version handshake
   * the way the socket does: a tab opened before the field existed still posts.
   */
  locale: localeSchema.default(DEFAULT_LOCALE)
})

/**
 * The one place a `hostToken` reaches a client. It is never on the socket and
 * never in a room view: a screen holds it because it opened the room, or because
 * somebody read it out of that screen's menu and typed it.
 */
export const createRoomResponseSchema = z.object({
  code: roomCodeSchema,
  hostToken: hostTokenSchema
})

export const roomExistsResponseSchema = z.object({
  exists: z.boolean()
})

export const WALL_PAIRING_CODE_LENGTH = 6

/**
 * Shown on the wall, big, and either scanned by the host's device or typed into
 * its menu. The room's alphabet because it is read across a room and typed.
 * Seeing it is harmless: it pairs only a device that also holds the room's
 * token, which is why it can sit on a screen everyone is looking at.
 */
export const wallPairingCodeSchema = z
  .string()
  .length(WALL_PAIRING_CODE_LENGTH)
  .regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]+$`))

/**
 * `secret` is the waiting screen's alone, and it is what the token is handed
 * back against: the code is on display, so the code cannot be what collects.
 */
export const openWallPairingResponseSchema = z.object({
  pairingCode: wallPairingCodeSchema,
  secret: z.string().min(16).max(64)
})

export const wallPairingPollQuerySchema = z.object({
  secret: z.string().min(16).max(64)
})

/**
 * The second place a `hostToken` reaches a client, and the only one it reaches
 * one that did not open the room: the host's device vouched for this screen by
 * sending the token itself. Read once — the pairing is gone after it.
 */
export const wallPairingPollResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('waiting') }),
  z.object({
    hostToken: hostTokenSchema,
    roomCode: roomCodeSchema,
    status: z.literal('paired')
  })
])

export const pairWallRequestSchema = z.object({
  hostToken: hostTokenSchema,
  roomCode: roomCodeSchema
})

/**
 * No `previewUrl`: Deezer signs those with a short expiry, so the audio is
 * resolved when the round starts. A pool built at lobby time and played an hour
 * later would carry dead signatures.
 */
export const catalogueTrackSchema = trackIdentitySchema

/**
 * The difficulty rides along so the preview counts what the pool would actually
 * hold. Defaulted rather than required: it is a lobby convenience, and a caller
 * that omits it gets the same floor the room starts on.
 */
export const trackSearchQuerySchema = z.object({
  difficulty: trackDifficultySchema.default('easy'),
  q: z.string().trim().min(1).max(120)
})

export const playlistPreviewQuerySchema = z.object({
  difficulty: trackDifficultySchema.default('easy')
})

/** Shared by every route that answers "what would the pool hold?", not just the search. */
/**
 * A sample the console plays to check the room hears it: a preview resolved
 * as it is asked for, because Deezer signs each with an expiry and a cached
 * one would be a dead link the next evening.
 */
export const soundCheckResponseSchema = z.object({
  previewUrl: soundCheckUrlSchema
})

export const trackListResponseSchema = z.object({
  tracks: z.array(catalogueTrackSchema)
})

/**
 * `build` and `committedAt` answer "is my fix live?" and nothing else — the
 * hash proves it, the day is what a person reads. Both are the deployment's,
 * not the tab's: a client holding a cached bundle still reads what the server
 * was built from, which is the question being asked.
 */
export const healthResponseSchema = z.object({
  build: z.string(),
  /** When the deployed commit was made, in epoch milliseconds; `null` from a checkout, whose `build` is `dev`. */
  committedAt: z.number().int().positive().nullable(),
  protocolVersion: z.number().int().positive(),
  status: z.literal('ok')
})

/**
 * The socket's codes plus the two only a request can earn: a body or a query
 * the schema refused, and a path nothing is registered on. Kept off
 * `protocolErrorCodeSchema` because no socket frame carries either.
 */
export const httpErrorCodeSchema = z.enum([
  ...protocolErrorCodeSchema.options,
  'invalid_input',
  'not_found'
])

export const apiErrorResponseSchema = z.object({
  code: httpErrorCodeSchema,
  message: z.string()
})

/**
 * What a screen says went wrong on it, sent to `POST /api/reports` and kept
 * thirty days. Every field is a closed shape — an enum, a bounded number, a
 * pattern no sentence matches — save the error's own name, message and stack,
 * which the browser writes. That is what makes a nickname, an answer, a typed
 * guess, a session id or a host token **structurally** unable to ride along:
 * there is no free-form bag to put one in, and `strictObject` refuses a key
 * nobody declared. Payloads of frames never travel, only their `type`.
 */
export const clientReportKinds = [
  'uncaught',
  'caught-by-boundary',
  'unhandled-rejection',
  'refused-frame',
  'clip-fault',
  'socket-fatal'
] as const

/** Written by the server itself, never accepted from a screen. */
export const serverReportKinds = ['server-error', 'clip-reported'] as const

export const clientReportKindSchema = z.enum(clientReportKinds)

export const reportBrowsers = [
  'chrome',
  'edge',
  'firefox',
  'safari',
  'samsung-internet',
  'opera',
  'other'
] as const

export const reportSystems = [
  'windows',
  'macos',
  'ios',
  'android',
  'linux',
  'chromeos',
  'tizen',
  'webos',
  'other'
] as const

export const reportAudioContextStates = [
  'suspended',
  'running',
  'closed',
  'interrupted'
] as const

/** The frame types either end may name, read off the unions so a new frame is covered as it lands. */
export const reportFrameTypes = [
  ...new Set(
    [
      ...clientMessageSchema.options,
      ...hostServerMessageSchema.options,
      ...playerServerMessageSchema.options,
      ...wallServerMessageSchema.options
    ].map((option) => option.shape.type.value)
  )
]

export const REPORT_FRAMES_KEPT = 20
export const REPORT_BODY_MAX_BYTES = 16_384

const REPORT_ERROR_NAME_MAX = 80
const REPORT_ERROR_MESSAGE_MAX = 500
const REPORT_ERROR_STACK_MAX = 4000
const REPORT_ROUTE_MAX = 200
const REPORT_BUILD_MAX = 64
const REPORT_VERSION_MAX = 24
const REPORT_VIEWPORT_MAX = 20_000
const REPORT_PIXEL_RATIO_MAX = 10
const MEDIA_ERROR_CODE_MAX = 4

export const REPORT_TEXT_LIMITS = {
  errorMessage: REPORT_ERROR_MESSAGE_MAX,
  errorName: REPORT_ERROR_NAME_MAX,
  errorStack: REPORT_ERROR_STACK_MAX
} as const

const viewportSideSchema = z
  .number()
  .int()
  .nonnegative()
  .max(REPORT_VIEWPORT_MAX)

const reportBrowserSchema = z.strictObject({
  name: z.enum(reportBrowsers),
  system: z.enum(reportSystems),
  version: z
    .string()
    .max(REPORT_VERSION_MAX)
    .regex(/^[\d.]*$/)
})

/** The entry chunk's hashed name, which tells one deployed build from another. */
const reportBuildSchema = z
  .string()
  .max(REPORT_BUILD_MAX)
  .regex(/^[\w.-]+$/)

const reportFramesSchema = z
  .array(
    z.strictObject({
      direction: z.enum(['in', 'out']),
      type: z.enum(reportFrameTypes)
    })
  )
  .max(REPORT_FRAMES_KEPT)

/** The path alone: no query, no fragment — the evening link rides in one. */
const reportRouteSchema = z
  .string()
  .max(REPORT_ROUTE_MAX)
  .regex(/^\/[\w/.-]*$/)

export const errorReportSchema = z.strictObject({
  audio: z.strictObject({
    contextState: z.enum(reportAudioContextStates).nullable(),
    /** `MediaError.code` of the clip that last failed on this screen. */
    mediaErrorCode: z
      .number()
      .int()
      .positive()
      .max(MEDIA_ERROR_CODE_MAX)
      .nullable(),
    /** This device's own level, 0 to 1 — not the room's. */
    volume: z.number().min(0).max(1).nullable()
  }),
  browser: reportBrowserSchema,
  build: reportBuildSchema,
  /** The refusal's code, or the clip's fault — never a sentence. */
  code: z.union([protocolErrorCodeSchema, clipFaultSchema]).nullable(),
  devicePixelRatio: z.number().positive().max(REPORT_PIXEL_RATIO_MAX),
  error: z
    .strictObject({
      message: z.string().max(REPORT_ERROR_MESSAGE_MAX),
      name: z.string().max(REPORT_ERROR_NAME_MAX),
      stack: z.string().max(REPORT_ERROR_STACK_MAX).nullable()
    })
    .nullable(),
  frames: reportFramesSchema,
  game: gameKindSchema.nullable(),
  isSpeaker: z.boolean().nullable(),
  kind: clientReportKindSchema,
  phase: roomPhaseSchema.nullable(),
  role: z.enum(['host', 'player', 'wall']).nullable(),
  roomCode: roomCodeSchema.nullable(),
  roundIndex: z.number().int().positive().nullable(),
  route: reportRouteSchema,
  viewport: z.strictObject({
    height: viewportSideSchema,
    width: viewportSideSchema
  })
})

/**
 * What somebody sends from the menu's _Report a problem_ to
 * `POST /api/bug-reports`, kept beside the error reports for thirty days.
 * Unlike `errorReportSchema` it leaves only on a press, so it carries what
 * that person chose to send: their own note, the raw user agent, the room as
 * this screen holds it — its own role's view, nicknames included, never
 * another role's — and what the screen went through in the last two minutes
 * (`events`), because the press comes after the keyboard that broke the page
 * has been closed. Never a session id, a host token or an address.
 */
export const BUG_REPORT_KIND = 'bug-report' as const
export const BUG_REPORT_BODY_MAX_BYTES = 65_536
export const BUG_REPORT_EVENTS_KEPT = 200
export const BUG_REPORT_NOTE_MAX = 2000
export const BUG_REPORT_EVENT_TEXT_MAX = 2000
const BUG_REPORT_EVENT_DETAIL_KEYS_MAX = 16
const BUG_REPORT_EVENT_AGE_MAX_MS = 600_000
export const BUG_REPORT_USER_AGENT_MAX = 512
export const BUG_REPORT_SHORT_TEXT_MAX = 80
const BUG_REPORT_VISUAL_SCALE_MAX = 20

export const bugReportRoles = [
  'host',
  'seated-host',
  'player',
  'wall',
  'front-door'
] as const

/** The apps whose own browser opens a shared link, read off their user-agent token. */
export const inAppBrowsers = [
  'instagram',
  'messenger',
  'whatsapp',
  'facebook',
  'tiktok',
  'snapchat'
] as const

export const bugReportEventTypes = [
  'viewport-resize',
  'viewport-scroll',
  'window-resize',
  'orientation',
  'focus-in',
  'focus-out',
  'visibility',
  'route',
  'socket-open',
  'socket-close',
  'socket-error',
  'uncaught',
  'unhandled-rejection',
  'console-error'
] as const

const shortTextSchema = z.string().max(BUG_REPORT_SHORT_TEXT_MAX)

const bugReportEventSchema = z.strictObject({
  /** Milliseconds before `sentAt`. */
  ago: z.number().int().nonnegative().max(BUG_REPORT_EVENT_AGE_MAX_MS),
  /** How many in a row were folded into this one, the last one's values kept. */
  count: z.number().int().positive(),
  detail: z
    .record(
      z.string().max(40),
      z.union([
        z.string().max(BUG_REPORT_EVENT_TEXT_MAX),
        z.number(),
        z.boolean(),
        z.null()
      ])
    )
    .refine(
      (detail) => Object.keys(detail).length <= BUG_REPORT_EVENT_DETAIL_KEYS_MAX
    ),
  type: z.enum(bugReportEventTypes)
})

const lengthSchema = z.number().nonnegative().max(REPORT_VIEWPORT_MAX)
const offsetSchema = z
  .number()
  .min(-REPORT_VIEWPORT_MAX)
  .max(REPORT_VIEWPORT_MAX)

export const bugReportSchema = z.strictObject({
  browser: reportBrowserSchema,
  build: reportBuildSchema,
  connection: z
    .strictObject({
      clockOffsetMs: z.number().nullable(),
      roundTripMs: z.number().nonnegative().nullable(),
      status: z.enum(['connecting', 'open', 'closed', 'refused'])
    })
    .nullable(),
  events: z.array(bugReportEventSchema).max(BUG_REPORT_EVENTS_KEPT),
  frames: reportFramesSchema,
  game: gameKindSchema.nullable(),
  inAppBrowser: z.enum(inAppBrowsers).nullable(),
  kind: z.literal(BUG_REPORT_KIND),
  /** What the person typed, which may be nothing. */
  note: z.string().max(BUG_REPORT_NOTE_MAX),
  phase: roomPhaseSchema.nullable(),
  preferences: z.strictObject({
    colorScheme: z.enum(['light', 'dark']),
    locale: localeSchema,
    reducedMotion: z.boolean(),
    theme: z.enum(['dark', 'light', 'system'])
  }),
  role: z.enum(bugReportRoles),
  roomCode: roomCodeSchema.nullable(),
  /** The arm of `round.content` on screen. */
  roundContentKind: shortTextSchema.regex(/^[\w-]*$/).nullable(),
  roundIndex: z.number().int().positive().nullable(),
  route: reportRouteSchema,
  /** `env(safe-area-inset-*)` as the page resolves it, in CSS pixels. */
  safeArea: z
    .strictObject({
      bottom: lengthSchema,
      left: lengthSchema,
      right: lengthSchema,
      top: lengthSchema
    })
    .nullable(),
  screen: z.strictObject({
    devicePixelRatio: z.number().positive().max(REPORT_PIXEL_RATIO_MAX),
    height: lengthSchema,
    orientation: shortTextSchema.nullable(),
    width: lengthSchema
  }),
  /** The client's own clock, epoch milliseconds: what each event's `ago` counts back from. */
  sentAt: z.number().int().positive(),
  /** The room's settings as this screen holds them. */
  settings: z.json().nullable(),
  userAgent: z.string().max(BUG_REPORT_USER_AGENT_MAX),
  /** User-Agent Client Hints, where the browser has them. */
  userAgentData: z
    .strictObject({
      brands: z
        .array(
          z.strictObject({ brand: shortTextSchema, version: shortTextSchema })
        )
        .max(12),
      mobile: z.boolean(),
      platform: shortTextSchema
    })
    .nullable(),
  /** This screen's whole room view, its own role's; `null` past the body's budget. */
  view: z.json().nullable(),
  viewport: z.strictObject({ height: lengthSchema, width: lengthSchema }),
  visualViewport: z
    .strictObject({
      height: lengthSchema,
      offsetLeft: offsetSchema,
      offsetTop: offsetSchema,
      scale: z.number().positive().max(BUG_REPORT_VISUAL_SCALE_MAX),
      width: lengthSchema
    })
    .nullable()
})

export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>
export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>
export type RoomExistsResponse = z.infer<typeof roomExistsResponseSchema>
export type WallPairingCode = z.infer<typeof wallPairingCodeSchema>
export type OpenWallPairingResponse = z.infer<
  typeof openWallPairingResponseSchema
>
export type WallPairingPollResponse = z.infer<
  typeof wallPairingPollResponseSchema
>
export type PairWallRequest = z.infer<typeof pairWallRequestSchema>
export type CatalogueTrack = z.infer<typeof catalogueTrackSchema>
export type SoundCheckResponse = z.infer<typeof soundCheckResponseSchema>
export type TrackListResponse = z.infer<typeof trackListResponseSchema>
export type HealthResponse = z.infer<typeof healthResponseSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
export type WallPairingPollQuery = z.input<typeof wallPairingPollQuerySchema>
export type TrackSearchQuery = z.input<typeof trackSearchQuerySchema>
export type PlaylistPreviewQuery = z.input<typeof playlistPreviewQuerySchema>
export type ErrorReport = z.infer<typeof errorReportSchema>
export type ClientReportKind = z.infer<typeof clientReportKindSchema>
export type ServerReportKind = (typeof serverReportKinds)[number]
export type ReportFrameType = (typeof reportFrameTypes)[number]
export type BugReport = z.infer<typeof bugReportSchema>
export type BugReportEvent = BugReport['events'][number]
export type BugReportEventType = (typeof bugReportEventTypes)[number]
export type BugReportRole = (typeof bugReportRoles)[number]
export type InAppBrowser = (typeof inAppBrowsers)[number]
