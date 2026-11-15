import { logger } from '@/infrastructure/logging/logger'
import {
  LIVE_ROOM_STALE_MS,
  REPORT_RETENTION_MS,
  type ReportStore
} from '@/infrastructure/reports/report-store'

/** The Worker's store: the `OBSERVABILITY` database, one per environment. */
export const d1ReportStore = (database: D1Database): ReportStore => ({
  purge: async ({ now }) => {
    const [reports, liveRooms] = await database.batch([
      database
        .prepare('DELETE FROM reports WHERE received_at < ?')
        .bind(now - REPORT_RETENTION_MS),
      database
        .prepare('DELETE FROM rooms_live WHERE updated_at < ?')
        .bind(now - LIVE_ROOM_STALE_MS)
    ])

    return {
      liveRooms: liveRooms?.meta.changes ?? 0,
      reports: reports?.meta.changes ?? 0
    }
  },
  record: async (report) => {
    try {
      await database
        .prepare(
          `INSERT INTO reports (received_at, source, kind, code, error_name,
            error_message, server_build, client_build, browser_name,
            browser_version, system, role, game, phase, room_code, context)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          report.receivedAt,
          report.source,
          report.kind,
          report.code,
          report.errorName,
          report.errorMessage,
          report.serverBuild,
          report.clientBuild,
          report.browserName,
          report.browserVersion,
          report.system,
          report.role,
          report.game,
          report.phase,
          report.roomCode,
          report.context
        )
        .run()
    } catch (error) {
      logger.error('Could not keep a report', {
        kind: report.kind,
        reason: error instanceof Error ? error.message : String(error)
      })
    }
  }
})
