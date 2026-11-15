import type {
  AdminLiveRoom,
  AdminReportResponse,
  AdminReportsQuery,
  AdminReportsResponse
} from '@melee/protocol/admin'
import type {
  ClientReportKind,
  ErrorReport,
  ServerReportKind
} from '@melee/protocol/http'

const DAY_MS = 86_400_000

/** How long a report is kept, said on the legal page in both dictionaries. */
export const REPORT_RETENTION_MS = 30 * DAY_MS

/** A live-room row nothing has touched for this long is a room that went without saying. */
export const LIVE_ROOM_STALE_MS = DAY_MS

/** How long `/admin` keeps listing a room after it closed, so a room ending is seen leaving. */
export const CLOSED_ROOM_SHOWN_MS = 15 * 60_000

/**
 * What the server notes about its own faults. Built from what the server
 * already holds, never from a frame's payload — the clip a speaker reported is
 * its fault code, not the message that carried it.
 */
export type ServerReport =
  | {
      error: { message: string; name: string; stack: string | null }
      kind: Extract<ServerReportKind, 'server-error'>
      route: string
    }
  | {
      code: string | null
      game: string | null
      isSpeaker: boolean
      kind: Extract<ServerReportKind, 'clip-reported'>
      phase: string
      role: 'host' | 'wall'
      roomCode: string
      roundIndex: number | null
    }

/** One row of `reports`, its filterable fields lifted out of `context`. */
export type StoredReport = {
  browserName: string | null
  browserVersion: string | null
  clientBuild: string | null
  code: string | null
  context: string
  errorMessage: string | null
  errorName: string | null
  game: string | null
  kind: ClientReportKind | ServerReportKind
  phase: string | null
  receivedAt: number
  role: string | null
  roomCode: string | null
  serverBuild: string
  source: 'client' | 'server'
  system: string | null
}

/**
 * Where reports are kept: D1 on the Worker, an array in the Node suites.
 * `record` never throws — a report that cannot be kept is logged and dropped,
 * because failing the request would only make another report.
 */
export type ReportStore = {
  /** Writes a room's row whole, replacing what it held: a code drawn again is a new room. Never throws. */
  keepLiveRoom: (row: AdminLiveRoom) => Promise<void>
  /** Open rooms, and the ones closed since `closedSince`, most recently moved first. */
  liveRooms: (input: { closedSince: number }) => Promise<AdminLiveRoom[]>
  purge: (input: { now: number }) => Promise<{
    liveRooms: number
    reports: number
  }>
  record: (report: StoredReport) => Promise<void>
  /** `null` for an id never kept, or purged since. */
  report: (id: number) => Promise<AdminReportResponse | null>
  /** Newest first, narrowed by every filter the query names. */
  reports: (query: AdminReportsQuery) => Promise<AdminReportsResponse>
}

/** The whole report back out of its `context` column, which only the server ever wrote. */
export const parsedContext = (context: string): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(context)

  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? Object.fromEntries(Object.entries(parsed))
    : { value: parsed }
}

export const storedClientReport = ({
  receivedAt,
  report,
  serverBuild
}: {
  receivedAt: number
  report: ErrorReport
  serverBuild: string
}): StoredReport => ({
  browserName: report.browser.name,
  browserVersion: report.browser.version,
  clientBuild: report.build,
  code: report.code,
  context: JSON.stringify(report),
  errorMessage: report.error?.message ?? null,
  errorName: report.error?.name ?? null,
  game: report.game,
  kind: report.kind,
  phase: report.phase,
  receivedAt,
  role: report.role,
  roomCode: report.roomCode,
  serverBuild,
  source: 'client',
  system: report.browser.system
})

export const storedServerReport = ({
  receivedAt,
  report,
  serverBuild
}: {
  receivedAt: number
  report: ServerReport
  serverBuild: string
}): StoredReport => {
  const shared = {
    browserName: null,
    browserVersion: null,
    clientBuild: null,
    context: JSON.stringify(report),
    receivedAt,
    serverBuild,
    source: 'server',
    system: null
  } as const

  return report.kind === 'server-error'
    ? {
        ...shared,
        code: null,
        errorMessage: report.error.message,
        errorName: report.error.name,
        game: null,
        kind: report.kind,
        phase: null,
        role: null,
        roomCode: null
      }
    : {
        ...shared,
        code: report.code,
        errorMessage: null,
        errorName: null,
        game: report.game,
        kind: report.kind,
        phase: report.phase,
        role: report.role,
        roomCode: report.roomCode
      }
}
