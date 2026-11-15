import {
  type AdminLiveRoom,
  type AdminReportSummary,
  type AdminReportsQuery,
  adminLiveRoomSchema,
  adminReportSummarySchema
} from '@melee/protocol/admin'

import { logger } from '@/infrastructure/logging/logger'
import {
  LIVE_ROOM_STALE_MS,
  parsedContext,
  REPORT_RETENTION_MS,
  type ReportStore
} from '@/infrastructure/reports/report-store'

const SUMMARY_COLUMNS = `id, received_at AS receivedAt, source, kind, code,
  error_name AS errorName, error_message AS errorMessage,
  server_build AS serverBuild, client_build AS clientBuild,
  browser_name AS browserName, browser_version AS browserVersion, system, role,
  game, phase, room_code AS roomCode`

const LIVE_ROOM_COLUMNS = `code, opened_at AS openedAt, updated_at AS updatedAt,
  game, phase, round_index AS roundIndex, seat_count AS seatCount,
  wall_count AS wallCount, closed_at AS closedAt`

const reportFilters = (
  query: AdminReportsQuery
): { binds: (number | string)[]; where: string } => {
  const clauses: string[] = []
  const binds: (number | string)[] = []
  const narrow = (clause: string, ...values: (number | string)[]) => {
    clauses.push(clause)
    binds.push(...values)
  }

  if (query.before !== undefined) narrow('id < ?', query.before)
  if (query.kind !== undefined) narrow('kind = ?', query.kind)
  if (query.game !== undefined) narrow('game = ?', query.game)
  if (query.browser !== undefined) narrow('browser_name = ?', query.browser)
  if (query.room !== undefined)
    narrow('room_code = ?', query.room.toUpperCase())
  if (query.from !== undefined) narrow('received_at >= ?', query.from)
  if (query.to !== undefined) narrow('received_at <= ?', query.to)
  if (query.build !== undefined) {
    narrow('(client_build = ? OR server_build = ?)', query.build, query.build)
  }

  return {
    binds,
    where: clauses.length === 0 ? '' : `WHERE ${clauses.join(' AND ')}`
  }
}

/** The Worker's store: the `OBSERVABILITY` database, one per environment. */
export const d1ReportStore = (database: D1Database): ReportStore => ({
  keepLiveRoom: async (row) => {
    try {
      await database
        .prepare(
          `INSERT OR REPLACE INTO rooms_live (code, opened_at, updated_at, game,
            phase, round_index, seat_count, wall_count, closed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          row.code,
          row.openedAt,
          row.updatedAt,
          row.game,
          row.phase,
          row.roundIndex,
          row.seatCount,
          row.wallCount,
          row.closedAt
        )
        .run()
    } catch (error) {
      logger.error('Could not keep a live-room row', {
        code: row.code,
        reason: error instanceof Error ? error.message : String(error)
      })
    }
  },
  liveRooms: async ({ closedSince }) => {
    const { results } = await database
      .prepare(
        `SELECT ${LIVE_ROOM_COLUMNS} FROM rooms_live
        WHERE closed_at IS NULL OR closed_at >= ?
        ORDER BY updated_at DESC`
      )
      .bind(closedSince)
      .all()

    return results.map((row): AdminLiveRoom => adminLiveRoomSchema.parse(row))
  },
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
  },
  report: async (id) => {
    const row = await database
      .prepare(`SELECT ${SUMMARY_COLUMNS}, context FROM reports WHERE id = ?`)
      .bind(id)
      .first<Record<string, unknown> & { context: string }>()

    return row === null
      ? null
      : {
          ...adminReportSummarySchema.parse(row),
          context: parsedContext(row.context)
        }
  },
  reports: async (query) => {
    const { binds, where } = reportFilters(query)
    const { results } = await database
      .prepare(
        `SELECT ${SUMMARY_COLUMNS} FROM reports ${where}
        ORDER BY id DESC LIMIT ?`
      )
      .bind(...binds, query.limit + 1)
      .all()
    const rows = results.map(
      (row): AdminReportSummary => adminReportSummarySchema.parse(row)
    )
    const reports = rows.slice(0, query.limit)

    return {
      nextBefore:
        rows.length > query.limit ? (reports.at(-1)?.id ?? null) : null,
      reports
    }
  }
})
