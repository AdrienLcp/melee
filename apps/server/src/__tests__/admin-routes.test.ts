import { describe, expect, it } from 'vitest'

import {
  adminLiveRoomsResponseSchema,
  adminReportResponseSchema,
  adminReportsResponseSchema
} from '@melee/protocol/admin'
import type { ErrorReport } from '@melee/protocol/http'
import { API_ROUTES, fillRoute } from '@melee/protocol/routes'

import { createApp } from '@/infrastructure/node/node-app'
import { storedClientReport } from '@/infrastructure/reports/report-store'

const ADMIN_TOKEN = 'a-long-enough-admin-key-for-the-suite-0123'

const REPORT: ErrorReport = {
  audio: { contextState: 'running', mediaErrorCode: null, volume: null },
  browser: { name: 'chrome', system: 'windows', version: '131' },
  build: 'index-B3x9q',
  code: null,
  devicePixelRatio: 1,
  error: { message: 'boom', name: 'TypeError', stack: 'at render' },
  frames: [{ direction: 'out', type: 'host.startRound' }],
  game: 'quiz',
  isSpeaker: false,
  kind: 'uncaught',
  phase: 'playing',
  role: 'player',
  roomCode: 'ABCD',
  roundIndex: 1,
  route: '/play/ABCD',
  viewport: { height: 800, width: 400 }
}

const asAdmin = { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }

const appHolding = async (reports: ErrorReport[]) => {
  const created = createApp({ adminToken: ADMIN_TOKEN })

  for (const [index, report] of reports.entries()) {
    await created.reports.record(
      storedClientReport({
        receivedAt: 1000 + index,
        report,
        serverBuild: 'abc1234'
      })
    )
  }

  return created
}

describe('admin routes', () => {
  it('[admin] answers 404 and no data without the key, with a wrong one, or with none set', async () => {
    const { app } = await appHolding([REPORT])
    const { app: keyless } = createApp()

    const answers = await Promise.all([
      app.request(API_ROUTES.adminReports),
      app.request(API_ROUTES.adminRooms, {
        headers: {
          Authorization: 'Bearer not-the-key-at-all-not-the-key-at-all'
        }
      }),
      keyless.request(API_ROUTES.adminReports, asAdmin)
    ])

    expect(answers.map((response) => response.status)).toEqual([404, 404, 404])
    for (const response of answers) {
      expect(await response.text()).not.toContain('boom')
    }
  })

  it('[admin] lists reports newest first, narrowed by a filter, a page at a time', async () => {
    const { app } = await appHolding([
      REPORT,
      { ...REPORT, browser: { ...REPORT.browser, name: 'safari' } },
      REPORT,
      { ...REPORT, kind: 'refused-frame' }
    ])

    const firstPage = adminReportsResponseSchema.parse(
      await (
        await app.request(
          `${API_ROUTES.adminReports}?kind=uncaught&browser=chrome&limit=1`,
          asAdmin
        )
      ).json()
    )

    expect(firstPage.reports.map((report) => report.id)).toEqual([3])
    expect(firstPage.nextBefore).toBe(3)

    const secondPage = adminReportsResponseSchema.parse(
      await (
        await app.request(
          `${API_ROUTES.adminReports}?kind=uncaught&browser=chrome&limit=1&before=3`,
          asAdmin
        )
      ).json()
    )

    expect(secondPage.reports.map((report) => report.id)).toEqual([1])
    expect(secondPage.nextBefore).toBeNull()
  })

  it('[admin] hands one report back with its whole context', async () => {
    const { app } = await appHolding([REPORT])

    const response = await app.request(
      fillRoute(API_ROUTES.adminReport, { id: '1' }),
      asAdmin
    )
    const report = adminReportResponseSchema.parse(await response.json())

    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(report.context).toEqual(REPORT)
    expect(
      (
        await app.request(
          fillRoute(API_ROUTES.adminReport, { id: '9' }),
          asAdmin
        )
      ).status
    ).toBe(404)
  })

  it('[admin] lists open rooms and the ones closed a moment ago', async () => {
    const { app, reports } = createApp({ adminToken: ADMIN_TOKEN })
    const row = {
      closedAt: null,
      code: 'ABCD',
      game: 'quiz',
      openedAt: 1,
      phase: 'lobby',
      roundIndex: null,
      seatCount: 3,
      updatedAt: 2,
      wallCount: 1
    }

    await reports.keepLiveRoom(row)
    await reports.keepLiveRoom({ ...row, closedAt: 3, code: 'EFGH' })

    const listed = adminLiveRoomsResponseSchema.parse(
      await (await app.request(API_ROUTES.adminRooms, asAdmin)).json()
    )

    expect(listed.rooms.map((room) => room.code)).toEqual(['ABCD'])
  })
})
