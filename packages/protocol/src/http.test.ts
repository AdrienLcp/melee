import { describe, expect, it } from 'vitest'

import { type ErrorReport, errorReportSchema, REPORT_FRAMES_KEPT } from './http'

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
