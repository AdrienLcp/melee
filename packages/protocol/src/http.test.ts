import { describe, expect, it } from 'vitest'

import {
  BUG_REPORT_EVENTS_KEPT,
  BUG_REPORT_NOTE_MAX,
  type BugReport,
  bugReportSchema,
  type ErrorReport,
  errorReportSchema,
  REPORT_FRAMES_KEPT
} from './http'

const VALID_REPORT: ErrorReport = {
  audio: { contextState: 'running', mediaErrorCode: null, volume: 0 },
  browser: { name: 'chrome', system: 'tizen', version: '94.0.4606' },
  build: 'index-B3x9q',
  code: null,
  devicePixelRatio: 1,
  error: { message: 'x is not a function', name: 'TypeError', stack: null },
  frames: [
    { direction: 'out', type: 'hello' },
    { direction: 'in', type: 'room.updated' }
  ],
  game: 'quiz',
  isSpeaker: true,
  kind: 'uncaught',
  phase: 'playing',
  role: 'wall',
  roomCode: 'ABCD',
  roundIndex: 3,
  route: '/wall/ABCD',
  viewport: { height: 1080, width: 1920 }
}

describe('error report schema', () => {
  it('[reports] accepts a report holding only its declared fields', () => {
    expect(errorReportSchema.safeParse(VALID_REPORT).success).toBe(true)
  })

  it.each([
    ['nickname', { ...VALID_REPORT, nickname: 'Marie' }],
    ['sessionId', { ...VALID_REPORT, sessionId: 'abc' }],
    [
      'a key inside the error',
      { ...VALID_REPORT, error: { ...VALID_REPORT.error, answer: 'Paris' } }
    ],
    [
      'a frame payload',
      {
        ...VALID_REPORT,
        frames: [{ direction: 'out', text: 'Paris', type: 'player.answer' }]
      }
    ]
  ])('[reports] refuses a report carrying %s', (_, report) => {
    expect(errorReportSchema.safeParse(report).success).toBe(false)
  })

  it.each([
    [
      'an error message past its cap',
      { error: { message: 'x'.repeat(501), name: 'Error', stack: null } }
    ],
    [
      'a stack past its cap',
      { error: { message: '', name: 'Error', stack: 'x'.repeat(4001) } }
    ],
    [
      'more frames than are kept',
      {
        frames: Array.from({ length: REPORT_FRAMES_KEPT + 1 }, () => ({
          direction: 'in',
          type: 'room.updated'
        }))
      }
    ],
    [
      'a frame type no union names',
      { frames: [{ direction: 'in', type: 'Marie' }] }
    ],
    ['a route with a query', { route: '/play/ABCD?name=Marie' }],
    [
      'a browser version that is a sentence',
      { browser: { name: 'chrome', system: 'other', version: 'Marie' } }
    ],
    ['a refusal code nobody sends', { code: 'Marie' }]
  ])('[reports] refuses %s', (_, override) => {
    expect(
      errorReportSchema.safeParse({ ...VALID_REPORT, ...override }).success
    ).toBe(false)
  })
})

const VALID_BUG_REPORT: BugReport = {
  browser: { name: 'chrome', system: 'android', version: '131.0' },
  build: 'index-B3x9q',
  connection: null,
  events: [
    {
      ago: 1200,
      count: 4,
      detail: { height: 380, offsetTop: 0, scale: 1, width: 412 },
      type: 'viewport-resize'
    }
  ],
  frames: [{ direction: 'in', type: 'room.updated' }],
  game: null,
  inAppBrowser: null,
  kind: 'bug-report',
  note: '',
  phase: null,
  preferences: {
    colorScheme: 'light',
    locale: 'en',
    reducedMotion: true,
    theme: 'light'
  },
  role: 'front-door',
  roomCode: null,
  roundContentKind: null,
  roundIndex: null,
  route: '/en',
  safeArea: null,
  screen: {
    devicePixelRatio: 2.625,
    height: 915,
    orientation: null,
    width: 412
  },
  sentAt: 1_763_200_000_000,
  settings: null,
  userAgent: 'Mozilla/5.0 (Linux; Android 14)',
  userAgentData: {
    brands: [{ brand: 'Chromium', version: '131' }],
    mobile: true,
    platform: 'Android'
  },
  view: null,
  viewport: { height: 915, width: 412 },
  visualViewport: {
    height: 380.5,
    offsetLeft: 0,
    offsetTop: 0,
    scale: 1,
    width: 412
  }
}

describe('bug report schema', () => {
  it('[bug-reports] accepts a report sent from a front door with an empty note', () => {
    expect(bugReportSchema.safeParse(VALID_BUG_REPORT).success).toBe(true)
  })

  it('[bug-reports] accepts the room view as the screen holds it', () => {
    const report = {
      ...VALID_BUG_REPORT,
      role: 'seated-host',
      settings: { game: { kind: 'quiz' }, roundCount: null },
      view: { phase: 'playing', seats: [{ nickname: 'Marie' }] }
    }

    expect(bugReportSchema.safeParse(report).success).toBe(true)
  })

  it.each([
    ['sessionId', { sessionId: 'abc' }],
    ['hostToken', { hostToken: 'abc' }],
    ['address', { address: '203.0.113.7' }],
    [
      'a key inside the visual viewport',
      {
        visualViewport: {
          ...VALID_BUG_REPORT.visualViewport,
          typed: 'Paris'
        }
      }
    ],
    [
      'a key inside an event',
      { events: [{ ...VALID_BUG_REPORT.events[0], text: 'Paris' }] }
    ]
  ])('[bug-reports] refuses a report carrying %s', (_, override) => {
    expect(
      bugReportSchema.safeParse({ ...VALID_BUG_REPORT, ...override }).success
    ).toBe(false)
  })

  it.each([
    ['a note past its cap', { note: 'x'.repeat(BUG_REPORT_NOTE_MAX + 1) }],
    [
      'more events than are kept',
      {
        events: Array.from(
          { length: BUG_REPORT_EVENTS_KEPT + 1 },
          () => VALID_BUG_REPORT.events[0]
        )
      }
    ],
    [
      'an event with more details than an event holds',
      {
        events: [
          {
            ago: 0,
            count: 1,
            detail: Object.fromEntries(
              Array.from({ length: 17 }, (_, index) => [`k${index}`, index])
            ),
            type: 'route'
          }
        ]
      }
    ],
    [
      'an event type nobody records',
      { events: [{ ago: 0, count: 1, detail: {}, type: 'keypress' }] }
    ],
    ['a role nobody plays', { role: 'admin' }],
    ['a route with a query', { route: '/play/ABCD?name=Marie' }],
    ['a user agent past its cap', { userAgent: 'x'.repeat(513) }]
  ])('[bug-reports] refuses %s', (_, override) => {
    expect(
      bugReportSchema.safeParse({ ...VALID_BUG_REPORT, ...override }).success
    ).toBe(false)
  })
})
