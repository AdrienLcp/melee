import { describe, expect, it } from 'vitest'

import type { BugReport } from '@melee/protocol/http'

import { fittedBugReport } from './fitted-bug-report'

const eventAt = (ago: number): BugReport['events'][number] => ({
  ago,
  count: 1,
  detail: { label: 'x'.repeat(100) },
  type: 'viewport-resize'
})

const REPORT: BugReport = {
  browser: { name: 'chrome', system: 'android', version: '131' },
  build: 'dev',
  connection: null,
  events: Array.from({ length: 40 }, (_, index) => eventAt(40 - index)),
  frames: [],
  game: null,
  inAppBrowser: null,
  kind: 'bug-report',
  note: '',
  phase: null,
  preferences: {
    colorScheme: 'dark',
    locale: 'fr',
    reducedMotion: false,
    theme: 'system'
  },
  role: 'player',
  roomCode: null,
  roundContentKind: null,
  roundIndex: null,
  route: '/play/ABCD',
  safeArea: null,
  screen: { devicePixelRatio: 1, height: 800, orientation: null, width: 400 },
  sentAt: 1,
  settings: null,
  userAgent: 'test',
  userAgentData: null,
  view: { padding: 'y'.repeat(4000) },
  viewport: { height: 800, width: 400 },
  visualViewport: null
}

const bytesOf = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).length

describe('fitted bug report', () => {
  it('[bug-reports] leaves a report under its budget as it was', () => {
    expect(fittedBugReport({ maxBytes: 65_536, report: REPORT })).toBe(REPORT)
  })

  it('[bug-reports] drops the room view before any event', () => {
    const maxBytes = bytesOf({ ...REPORT, view: null })

    expect(fittedBugReport({ maxBytes, report: REPORT })).toEqual({
      ...REPORT,
      view: null
    })
  })

  it('[bug-reports] then drops the oldest events and keeps the newest', () => {
    const maxBytes = bytesOf({ ...REPORT, view: null }) - 1000
    const fitted = fittedBugReport({ maxBytes, report: REPORT })

    expect(bytesOf(fitted)).toBeLessThanOrEqual(maxBytes)
    expect(fitted?.events.at(-1)).toEqual(REPORT.events.at(-1))
    expect(fitted?.events.length).toBeLessThan(REPORT.events.length)
  })
})
