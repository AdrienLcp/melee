import type {
  ClientReportKind,
  ErrorReport,
  ReportFrameType
} from '@melee/protocol/http'
import {
  REPORT_FRAMES_KEPT,
  REPORT_TEXT_LIMITS,
  reportAudioContextStates
} from '@melee/protocol/http'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'
import type { ClipFault } from '@melee/protocol/sound'

import { browserIdentityOf } from '@/helpers/browser-identity'
import { createReportGate } from '@/helpers/report-gate'
import { sendErrorReport } from '@/infrastructure/api/melee-api'
import { describeScreen, onUnhandledFaults } from '@/infrastructure/browser'
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
      route: screen.path.replace(ROUTE_UNSAFE, '_').slice(0, ROUTE_MAX),
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
      reportFault({ error: faultOf(error), kind: 'uncaught' })
    },
    onRejection: (reason) => {
      reportFault({ error: faultOf(reason), kind: 'unhandled-rejection' })
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
