import type {
  AdminLiveRoom,
  AdminReportSummary,
  AdminReportsQuery
} from '@melee/protocol/admin'

import {
  LIVE_ROOM_STALE_MS,
  parsedContext,
  REPORT_RETENTION_MS,
  type ReportStore,
  type StoredReport
} from '@/infrastructure/reports/report-store'

type KeptReport = StoredReport & { id: number }

export type InProcessReportStore = ReportStore & {
  /** What was kept, oldest first, for a suite to read back. */
  kept: KeptReport[]
  /** Each room's row as it last wrote it, by room code. */
  liveRoomRows: Map<string, AdminLiveRoom>
}

const summaryOf = ({
  context: _,
  ...summary
}: KeptReport): AdminReportSummary => summary

const matches =
  (query: AdminReportsQuery) =>
  (report: KeptReport): boolean =>
    (query.before === undefined || report.id < query.before) &&
    (query.kind === undefined || report.kind === query.kind) &&
    (query.game === undefined || report.game === query.game) &&
    (query.browser === undefined || report.browserName === query.browser) &&
    (query.room === undefined ||
      report.roomCode === query.room.toUpperCase()) &&
    (query.from === undefined || report.receivedAt >= query.from) &&
    (query.to === undefined || report.receivedAt <= query.to) &&
    (query.build === undefined ||
      report.clientBuild === query.build ||
      report.serverBuild === query.build)

/** The database's stand-in for the Node suites, held in one process's memory. */
export const inProcessReportStore = (): InProcessReportStore => {
  const kept: KeptReport[] = []
  const liveRoomRows = new Map<string, AdminLiveRoom>()
  let lastId = 0

  return {
    keepLiveRoom: async (row) => {
      liveRoomRows.set(row.code, row)
    },
    kept,
    liveRoomRows,
    liveRooms: async ({ closedSince }) =>
      [...liveRoomRows.values()]
        .filter((row) => row.closedAt === null || row.closedAt >= closedSince)
        .toSorted((first, second) => second.updatedAt - first.updatedAt),
    purge: async ({ now }) => {
      const before = kept.length
      const fresh = kept.filter(
        (report) => report.receivedAt >= now - REPORT_RETENTION_MS
      )

      kept.splice(0, kept.length, ...fresh)

      const staleCodes = [...liveRoomRows]
        .filter(([, room]) => room.updatedAt < now - LIVE_ROOM_STALE_MS)
        .map(([code]) => code)

      for (const code of staleCodes) {
        liveRoomRows.delete(code)
      }

      return { liveRooms: staleCodes.length, reports: before - kept.length }
    },
    record: async (report) => {
      lastId += 1
      kept.push({ ...report, id: lastId })
    },
    report: async (id) => {
      const found = kept.find((report) => report.id === id)

      return found === undefined
        ? null
        : { ...summaryOf(found), context: parsedContext(found.context) }
    },
    reports: async (query) => {
      const rows = kept.toReversed().filter(matches(query))
      const reports = rows.slice(0, query.limit).map(summaryOf)

      return {
        nextBefore:
          rows.length > query.limit ? (reports.at(-1)?.id ?? null) : null,
        reports
      }
    }
  }
}
