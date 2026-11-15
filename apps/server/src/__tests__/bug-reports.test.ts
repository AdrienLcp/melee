import { describe, expect, it } from 'vitest'

import { BUG_REPORT_BODY_MAX_BYTES, type BugReport } from '@melee/protocol/http'
import { API_ROUTES } from '@melee/protocol/routes'

import {
  BUG_REPORTS_BEFORE_RATE_LIMIT,
  createApp
} from '@/infrastructure/node/node-app'
import { parsedContext } from '@/infrastructure/reports/report-store'

const REPORT: BugReport = {
  browser: { name: 'safari', system: 'ios', version: '18.2' },
  build: 'index-B3x9q',
  connection: { clockOffsetMs: -12, roundTripMs: 48, status: 'open' },
  events: [
    {
      ago: 4200,
      count: 3,
      detail: { height: 412, offsetTop: 0, scale: 1, width: 390 },
      type: 'viewport-resize'
    },
    {
      ago: 4300,
      count: 1,
      detail: { role: null, tag: 'input', type: 'text' },
      type: 'focus-in'
    }
  ],
  frames: [{ direction: 'in', type: 'room.updated' }],
  game: 'petitbac',
  inAppBrowser: 'instagram',
  kind: 'bug-report',
  note: 'Everything vanished when the keyboard opened',
  phase: 'playing',
  preferences: {
    colorScheme: 'dark',
    locale: 'fr',
    reducedMotion: false,
    theme: 'system'
  },
  role: 'player',
  roomCode: 'ABCD',
  roundContentKind: 'petitbac',
  roundIndex: 2,
  route: '/play/ABCD',
  safeArea: { bottom: 34, left: 0, right: 0, top: 47 },
  screen: {
    devicePixelRatio: 3,
    height: 844,
    orientation: 'portrait-primary',
    width: 390
  },
  sentAt: 1_763_200_000_000,
  settings: { roundCount: 8 },
  userAgent: 'Mozilla/5.0 (iPhone) Instagram 300.0',
  userAgentData: null,
  view: { phase: 'playing', seats: [{ nickname: 'Marie' }] },
  viewport: { height: 844, width: 390 },
  visualViewport: {
    height: 412,
    offsetLeft: 0,
    offsetTop: 0,
    scale: 1,
    width: 390
  }
}

const postReport = (body: string, address = '203.0.113.7') => ({
  body,
  headers: { 'cf-connecting-ip': address, 'content-type': 'application/json' },
  method: 'POST'
})

describe('bug reports', () => {
  it('[bug-reports] keeps a sent report whole, its note where an error message would be listed', async () => {
    const { app, reports } = createApp()

    const response = await app.request(
      API_ROUTES.bugReports,
      postReport(JSON.stringify(REPORT))
    )

    expect(response.status).toBe(204)
    expect(reports.kept).toHaveLength(1)
    expect(reports.kept[0]).toMatchObject({
      errorMessage: REPORT.note,
      game: 'petitbac',
      kind: 'bug-report',
      role: 'player',
      roomCode: 'ABCD',
      source: 'client'
    })
    expect(parsedContext(reports.kept[0]?.context ?? '{}')).toMatchObject({
      events: REPORT.events,
      view: REPORT.view
    })
  })

  it('[bug-reports] keeps a report sent with no note, listing no message', async () => {
    const { app, reports } = createApp()

    const response = await app.request(
      API_ROUTES.bugReports,
      postReport(JSON.stringify({ ...REPORT, note: '' }))
    )

    expect(response.status).toBe(204)
    expect(reports.kept[0]?.errorMessage).toBeNull()
  })

  it('[bug-reports] refuses a body past its size before parsing it', async () => {
    const { app, reports } = createApp()

    const response = await app.request(
      API_ROUTES.bugReports,
      postReport(
        JSON.stringify({
          ...REPORT,
          view: { padding: 'x'.repeat(BUG_REPORT_BODY_MAX_BYTES) }
        })
      )
    )

    expect(response.status).toBe(413)
    expect(reports.kept).toHaveLength(0)
  })

  it('[bug-reports] refuses a report carrying a session id', async () => {
    const { app, reports } = createApp()

    const response = await app.request(
      API_ROUTES.bugReports,
      postReport(JSON.stringify({ ...REPORT, sessionId: 'abc' }))
    )

    expect(response.status).toBe(400)
    expect(reports.kept).toHaveLength(0)
  })

  it('[bug-reports] answers 429 past the allowance of one address in one room, and counts another apart', async () => {
    const { app, reports } = createApp()
    const body = JSON.stringify(REPORT)

    for (let sent = 0; sent < BUG_REPORTS_BEFORE_RATE_LIMIT; sent += 1) {
      await app.request(API_ROUTES.bugReports, postReport(body))
    }

    const refused = await app.request(API_ROUTES.bugReports, postReport(body))
    const elsewhere = await app.request(
      API_ROUTES.bugReports,
      postReport(body, '198.51.100.4')
    )

    expect(refused.status).toBe(429)
    expect(elsewhere.status).toBe(204)
    expect(reports.kept).toHaveLength(BUG_REPORTS_BEFORE_RATE_LIMIT + 1)
  })
})
