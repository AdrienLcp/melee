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
  purge: (input: { now: number }) => Promise<{
    liveRooms: number
    reports: number
  }>
  record: (report: StoredReport) => Promise<void>
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
