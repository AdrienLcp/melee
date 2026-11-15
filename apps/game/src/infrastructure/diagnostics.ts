import type {
  BugReport,
  BugReportEventType,
  ClientReportKind,
  ErrorReport,
  ReportFrameType
} from '@melee/protocol/http'
import {
  BUG_REPORT_EVENT_TEXT_MAX,
  BUG_REPORT_EVENTS_KEPT,
  REPORT_FRAMES_KEPT,
  REPORT_TEXT_LIMITS,
  reportAudioContextStates
} from '@melee/protocol/http'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'
import type { ClipFault } from '@melee/protocol/sound'

import { browserIdentityOf } from '@/helpers/browser-identity'
import { isBrowserNotice } from '@/helpers/browser-notice'
import { createEventRing } from '@/helpers/event-ring'
import { createReportGate } from '@/helpers/report-gate'
import { sendErrorReport } from '@/infrastructure/api/melee-api'
import {
  describeScreen,
  onScreenChanges,
  onUnhandledFaults
} from '@/infrastructure/browser'
import { nowMs } from '@/infrastructure/clock'
import { readStoredVolume } from '@/infrastructure/storage/preferences-storage'

/**
 * The room this screen is in, as its last snapshot drew it — what turns
 * "TypeError on a TV" into "TypeError on the quiz's wall, round 3, playing".
 * Never a nickname, an answer or a frame's payload: see `errorReportSchema`.
 */
export type RoomReportContext = Pick<
  ErrorReport,
  'game' | 'isSpeaker' | 'phase' | 'roundIndex'
> & {
  role: NonNullable<ErrorReport['role']>
  roomCode: RoomCode
  /** A console holding a seat as well; `false` on every other screen. */
  isSeated: boolean
  /** The arm of `round.content` on screen, `null` between rounds. */
  roundContentKind: string | null
  /** Read only into a report somebody sends, never into an error report. */
  settings: unknown
  /** This screen's whole snapshot, its own role's: read only into a report somebody sends. */
  view: unknown
}

type Frame = ErrorReport['frames'][number]

let room: RoomReportContext | null = null
let frames: Frame[] = []
let mediaErrorCode: number | null = null
let audioContextState: (() => string) | null = null

const passesGate = createReportGate()

/** Each role's connection hook calls this on every snapshot it draws. */
export const noteRoomView = (context: RoomReportContext): void => {
  room = context
}

/** The socket closing for good: a report after it is about no room. */
export const forgetRoom = (): void => {
  room = null
  frames = []
}

/** A frame's type and direction, never its payload. The clock's ping and pong would drown the rest. */
export const noteFrame = (frame: {
  direction: Frame['direction']
  type: ReportFrameType
}): void => {
  if (frame.type === 'time.ping' || frame.type === 'time.pong') {
    return
  }

  frames = [...frames, frame].slice(-REPORT_FRAMES_KEPT)
}

/** `MediaError.code` of the clip element that last failed. */
export const noteMediaError = (code: number | null): void => {
  mediaErrorCode = code
}

/** How the cue context reads its state, handed over once the context exists. */
export const noteAudioContext = (readState: () => string): void => {
  audioContextState = readState
}

const contextStateNow = (): ErrorReport['audio']['contextState'] => {
  const state = audioContextState?.()

  return reportAudioContextStates.find((known) => known === state) ?? null
}

const storedVolume = (): number | null => {
  const volume = readStoredVolume()

  return volume.status === 'success' ? volume.data : null
}

const ROUTE_UNSAFE = /[^\w/.-]/g
const ROUTE_MAX = 200

const reportedRoute = (path: string): string =>
  path.replace(ROUTE_UNSAFE, '_').slice(0, ROUTE_MAX)

/** The entry chunk's hashed name in a build; this module is part of the entry. */
const buildOfThisBundle = (): string => {
  if (import.meta.env.DEV) {
    return 'dev'
  }

  const file = new URL(import.meta.url).pathname.split('/').at(-1) ?? ''

  return file.replace(/\.js$/, '').replace(ROUTE_UNSAFE, '_') || 'unknown'
}

type Fault = NonNullable<ErrorReport['error']>

const faultOf = (error: unknown): Fault => {
  const raw =
    error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack ?? null }
      : { message: String(error), name: 'NonError', stack: null }

  return {
    message: raw.message.slice(0, REPORT_TEXT_LIMITS.errorMessage),
    name: raw.name.slice(0, REPORT_TEXT_LIMITS.errorName),
    stack: raw.stack?.slice(0, REPORT_TEXT_LIMITS.errorStack) ?? null
  }
}

/** The first frame of the stack names where it broke; two throws from one line are one fault. */
const whereOf = (fault: Fault | null): string =>
  fault?.stack?.split('\n').find((line) => line.trim().startsWith('at ')) ??
  fault?.stack?.split('\n')[1] ??
  ''

const reportFault = ({
  code = null,
  error,
  kind
}: {
  code?: ErrorReport['code']
  error: Fault | null
  kind: ClientReportKind
}): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const isNew = passesGate({
      message: error?.message ?? '',
      name: error?.name ?? kind,
      where: `${code ?? ''}:${room?.roundIndex ?? ''}:${whereOf(error)}`
    })

    if (!isNew) {
      return
    }

    const screen = describeScreen()

    sendErrorReport({
      audio: {
        contextState: contextStateNow(),
        mediaErrorCode,
        volume: storedVolume()
      },
      browser: browserIdentityOf(screen.userAgent),
      build: buildOfThisBundle(),
      code,
      devicePixelRatio: screen.devicePixelRatio,
      error,
      frames,
      game: room?.game ?? null,
      isSpeaker: room?.isSpeaker ?? null,
      kind,
      phase: room?.phase ?? null,
      role: room?.role ?? null,
      roomCode: room?.roomCode ?? null,
      roundIndex: room?.roundIndex ?? null,
      route: reportedRoute(screen.path),
      viewport: screen.viewport
    })
  } catch (failure) {
    console.error('Could not send an error report', failure)
  }
}

/** What reached the root error boundary, kept for whoever opens the console next. */
export const reportUnrenderedError = (error: unknown): void => {
  console.error('The app hit an error it could not render through', error)
  reportFault({ error: faultOf(error), kind: 'caught-by-boundary' })
}

/** `createRoot`'s own hooks: the boundary's catch, and what no boundary caught. */
export const rootErrorHandlers = {
  onCaughtError: (error: unknown): void => {
    console.error('A boundary caught an error', error)
    reportFault({ error: faultOf(error), kind: 'caught-by-boundary' })
  },
  onUncaughtError: (error: unknown): void => {
    console.error('The app hit an error no boundary caught', error)
    reportFault({ error: faultOf(error), kind: 'uncaught' })
  }
}

/** A throw outside React and a promise nobody awaited, from the first script on. */
export const watchUnhandledFaults = (): void => {
  onUnhandledFaults({
    onError: (error) => {
      const fault = faultOf(error)

      noteFaultEvent({ fault, type: 'uncaught' })

      if (isBrowserNotice(error)) {
        return
      }

      reportFault({ error: fault, kind: 'uncaught' })
    },
    onRejection: (reason) => {
      const fault = faultOf(reason)

      noteFaultEvent({ fault, type: 'unhandled-rejection' })
      reportFault({ error: fault, kind: 'unhandled-rejection' })
    }
  })
}

/**
 * An `invalid_message` answers a frame this app built, never something the
 * person pressed wrong — "try again" would resend the same frame. It is kept
 * off the screen and left here, with the server's reason, for the developer.
 */
export const isOurOwnMalformedFrame = (error: ProtocolErrorMessage): boolean =>
  error.code === 'invalid_message' && !error.fatal

/** The server's reason names the field and the rule, never the value. */
export const reportRefusedFrame = (error: ProtocolErrorMessage): void => {
  console.error('The server refused a frame this app built', error.message)
  reportFault({
    code: error.code,
    error: faultOf(new Error(error.message)),
    kind: 'refused-frame'
  })
}

/** The exits somebody chose: none of them is a fault. */
const CHOSEN_EXITS: ReadonlySet<ProtocolErrorMessage['code']> = new Set([
  'room_closed',
  'removed_by_host',
  'wall_dismissed'
])

/** A fatal refusal ending this screen's session for a reason nobody chose. */
export const reportFatalRefusal = (error: ProtocolErrorMessage): void => {
  if (CHOSEN_EXITS.has(error.code)) {
    return
  }

  reportFault({ code: error.code, error: null, kind: 'socket-fatal' })
}

/** A clip this screen should be sounding and is not. */
export const reportClipFault = (fault: ClipFault): void => {
  reportFault({ code: fault, error: null, kind: 'clip-fault' })
}

/**
 * Two minutes rather than the thirty seconds a fault takes to happen: the
 * person presses only after closing the keyboard that broke the page, then
 * the menu, then typing what they saw.
 */
const BUG_REPORT_EVENTS_WINDOW_MS = 120_000
const BUG_REPORT_EVENT_FOLD_MS = 120

type EventDetail = BugReport['events'][number]['detail']

const screenEvents = createEventRing<BugReportEventType, EventDetail>({
  capacity: BUG_REPORT_EVENTS_KEPT,
  coalesceMs: BUG_REPORT_EVENT_FOLD_MS
})

const noteEvent = (type: BugReportEventType, detail: EventDetail): void => {
  screenEvents.note({ at: nowMs(), detail, type })
}

const clippedText = (text: string): string =>
  text.slice(0, BUG_REPORT_EVENT_TEXT_MAX)

const noteFaultEvent = ({
  fault,
  type
}: {
  fault: Fault
  type: Extract<BugReportEventType, 'uncaught' | 'unhandled-rejection'>
}): void => {
  noteEvent(type, {
    message: clippedText(fault.message),
    name: fault.name,
    stack: fault.stack === null ? null : clippedText(fault.stack)
  })
}

const textOfLogged = (value: unknown): string => {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

/**
 * What the screen goes through, kept from the first script on in a ring a
 * report somebody sends will carry: the viewport and the focus, the tab's
 * visibility, and every `console.error`, which is where React and this app
 * say what went wrong without throwing.
 */
export const watchScreenForReports = (): void => {
  onScreenChanges(({ detail, type }) => {
    noteEvent(type, detail)
  })

  const logError = console.error.bind(console)

  console.error = (...values: unknown[]) => {
    noteEvent('console-error', {
      message: clippedText(values.map(textOfLogged).join(' '))
    })
    logError(...values)
  }
}

/** The page the router settled on, its path alone. */
export const noteRoute = (path: string): void => {
  noteEvent('route', { path: reportedRoute(path) })
}

/** The room's socket opening, closing or failing, with what the close said. */
export const noteSocketEvent = (
  type: Extract<BugReportEventType, `socket-${string}`>,
  detail: EventDetail = {}
): void => {
  noteEvent(type, detail)
}

/**
 * What this module holds for a report somebody sends at `sentAt` — the room
 * as its last snapshot drew it, the frames, and the ring's last two minutes.
 * The report itself is built by `bug-report.ts`, which the menu's chunk
 * carries: only the ring has to run from the first script.
 */
export const reportTrailAt = (sentAt: number) => ({
  build: buildOfThisBundle(),
  events: screenEvents
    .since(sentAt - BUG_REPORT_EVENTS_WINDOW_MS)
    .map(({ at, count, detail, type }) => ({
      ago: Math.max(0, sentAt - at),
      count,
      detail,
      type
    })),
  frames,
  room,
  route: reportedRoute(describeScreen().path)
})
