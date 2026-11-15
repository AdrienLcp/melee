import { afterEach, describe, expect, it, vi } from 'vitest'

import { type ErrorReport, REPORT_BODY_MAX_BYTES } from '@melee/protocol/http'
import { API_ROUTES } from '@melee/protocol/routes'

import { nowMs } from '@/infrastructure/clock'
import { inProcessReportStore } from '@/infrastructure/node/in-process-report-store'
import {
  createApp,
  REPORTS_BEFORE_RATE_LIMIT
} from '@/infrastructure/node/node-app'
import {
  REPORT_RETENTION_MS,
  storedClientReport
} from '@/infrastructure/reports/report-store'

const REPORT: ErrorReport = {
  audio: { contextState: 'suspended', mediaErrorCode: 4, volume: 0.8 },
  browser: { name: 'chrome', system: 'windows', version: '131' },
  build: 'index-B3x9q',
  code: 'blocked',
  devicePixelRatio: 1.5,
  error: null,
  frames: [{ direction: 'in', type: 'room.updated' }],
  game: 'blindtest',
  isSpeaker: true,
  kind: 'clip-fault',
  phase: 'playing',
  role: 'host',
  roomCode: 'ABCD',
  roundIndex: 2,
  route: '/host/ABCD',
  viewport: { height: 800, width: 1280 }
}

const postReport = (body: string) => ({
  body,
  headers: { 'content-type': 'application/json' },
  method: 'POST'
})

describe('error reports', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('[reports] keeps a valid report as a client row, its fields lifted out', async () => {
    const { app, reports } = createApp()

    const response = await app.request(
      API_ROUTES.reports,
      postReport(JSON.stringify(REPORT))
    )

    expect(response.status).toBe(204)
    expect(reports.kept).toHaveLength(1)
    expect(reports.kept[0]).toMatchObject({
      browserName: 'chrome',
      code: 'blocked',
      game: 'blindtest',
      kind: 'clip-fault',
      roomCode: 'ABCD',
      source: 'client'
    })
  })

  it('[reports] keeps nothing of a report carrying an undeclared field', async () => {
    const { app, reports } = createApp()

    const response = await app.request(
      API_ROUTES.reports,
      postReport(JSON.stringify({ ...REPORT, nickname: 'Marie' }))
    )

    expect(response.status).toBe(400)
    expect(reports.kept).toHaveLength(0)
  })

  it('[reports] refuses a body past its size before parsing it', async () => {
    const { app, reports } = createApp()

    const response = await app.request(
      API_ROUTES.reports,
      postReport(' '.repeat(REPORT_BODY_MAX_BYTES + 1))
    )

    expect(response.status).toBe(413)
    expect(reports.kept).toHaveLength(0)
  })

  it('[reports] refuses a body that is not JSON', async () => {
    const { app } = createApp()

    const response = await app.request(
      API_ROUTES.reports,
      postReport('{"kind":')
    )

    expect(response.status).toBe(400)
  })

  it('[reports] stops keeping one room’s reports past its allowance', async () => {
    const { app, reports } = createApp()
    const statuses: number[] = []

    for (let attempt = 0; attempt <= REPORTS_BEFORE_RATE_LIMIT; attempt++) {
      const response = await app.request(
        API_ROUTES.reports,
        postReport(JSON.stringify(REPORT))
      )

      statuses.push(response.status)
    }

    expect(statuses.at(-1)).toBe(429)
    expect(reports.kept).toHaveLength(REPORTS_BEFORE_RATE_LIMIT)
  })

  it('[reports] keeps an unhandled server error as a server row', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { app, reports } = createApp()

    app.get('/api/explode', () => {
      throw new RangeError('boom')
    })

    const response = await app.request('/api/explode')

    expect(response.status).toBe(500)
    await vi.waitFor(() => {
      expect(reports.kept[0]).toMatchObject({
        errorMessage: 'boom',
        errorName: 'RangeError',
        kind: 'server-error',
        source: 'server'
      })
    })
  })

  it('[reports] purges reports past their thirty days and keeps the rest', async () => {
    const store = inProcessReportStore()
    const now = nowMs()

    await store.record(
      storedClientReport({
        receivedAt: now - REPORT_RETENTION_MS - 1,
        report: REPORT,
        serverBuild: 'dev'
      })
    )
    await store.record(
      storedClientReport({
        receivedAt: now,
        report: REPORT,
        serverBuild: 'dev'
      })
    )

    const purged = await store.purge({ now })

    expect(purged.reports).toBe(1)
    expect(store.kept.map((report) => report.receivedAt)).toEqual([now])
  })
})
