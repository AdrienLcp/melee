import {
  LIVE_ROOM_STALE_MS,
  REPORT_RETENTION_MS,
  type ReportStore,
  type StoredReport
} from '@/infrastructure/reports/report-store'

export type InProcessReportStore = ReportStore & {
  /** What was kept, oldest first, for a suite to read back. */
  kept: StoredReport[]
  /** The rows a live-room writer keeps, by room code. */
  liveRooms: Map<string, { updatedAt: number }>
}

/** The database's stand-in for the Node suites, held in one process's memory. */
export const inProcessReportStore = (): InProcessReportStore => {
  const kept: StoredReport[] = []
  const liveRooms = new Map<string, { updatedAt: number }>()

  return {
    kept,
    liveRooms,
    purge: async ({ now }) => {
      const before = kept.length
      const fresh = kept.filter(
        (report) => report.receivedAt >= now - REPORT_RETENTION_MS
      )

      kept.splice(0, kept.length, ...fresh)

      const staleCodes = [...liveRooms]
        .filter(([, room]) => room.updatedAt < now - LIVE_ROOM_STALE_MS)
        .map(([code]) => code)

      for (const code of staleCodes) {
        liveRooms.delete(code)
      }

      return { liveRooms: staleCodes.length, reports: before - kept.length }
    },
    record: async (report) => {
      kept.push(report)
    }
  }
}
