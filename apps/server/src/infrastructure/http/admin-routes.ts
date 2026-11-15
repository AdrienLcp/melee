import { zValidator } from '@hono/zod-validator'
import type { Hono } from 'hono'
import { z } from 'zod'

import {
  type AdminLiveRoomsResponse,
  adminReportsQuerySchema
} from '@melee/protocol/admin'
import type { ApiErrorResponse } from '@melee/protocol/http'
import { API_PREFIX, API_ROUTES } from '@melee/protocol/routes'

import { nowMs } from '@/infrastructure/clock'
import { requireAdminToken } from '@/infrastructure/http/admin-access'
import { invalidInput } from '@/infrastructure/http/error-responses'
import {
  CLOSED_ROOM_SHOWN_MS,
  type ReportStore
} from '@/infrastructure/reports/report-store'

const reportIdSchema = z.coerce.number().int().positive()

const reportGone: ApiErrorResponse = {
  code: 'not_found',
  message: 'No report is kept under this id'
}

/**
 * What `/admin` reads: the rooms open now and the reports kept. Every route
 * sits behind `requireAdminToken`, registered first so no handler runs for a
 * request without the key.
 */
export const registerAdminRoutes = ({
  adminToken,
  app,
  reports
}: {
  /** `ADMIN_TOKEN`, a Worker secret; `null` keeps every admin route answering 404. */
  adminToken: string | null
  app: Hono
  reports: ReportStore
}): void => {
  app.use(`${API_PREFIX}/admin/*`, requireAdminToken(adminToken))

  app.get(API_ROUTES.adminRooms, async (context) => {
    const now = nowMs()
    const body: AdminLiveRoomsResponse = {
      now,
      rooms: await reports.liveRooms({
        closedSince: now - CLOSED_ROOM_SHOWN_MS
      })
    }

    return context.json(body)
  })

  app.get(
    API_ROUTES.adminReports,
    zValidator('query', adminReportsQuerySchema, invalidInput),
    async (context) =>
      context.json(await reports.reports(context.req.valid('query')))
  )

  app.get(API_ROUTES.adminReport, async (context) => {
    const id = reportIdSchema.safeParse(context.req.param('id'))
    const report = id.success ? await reports.report(id.data) : null

    return report === null
      ? context.json(reportGone, 404)
      : context.json(report)
  })
}
