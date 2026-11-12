import { describe, expect, it } from 'vitest'

import { LAST_LEAN_LEAD_MS, LEAN_INTERVAL_MS, leanDelayMs } from './lean-delay'

describe('leanDelayMs', () => {
  it('[lean] holds a change for the whole interval while the round has time', () => {
    expect(leanDelayMs(10_000)).toBe(LEAN_INTERVAL_MS)
  })

  it('[lean] holds a change for the whole interval while nothing counts down', () => {
    expect(leanDelayMs(null)).toBe(LEAN_INTERVAL_MS)
  })

  it('[lean] sends a held change before the round closes rather than after', () => {
    const closesInMs = LAST_LEAN_LEAD_MS + 100

    expect(closesInMs - leanDelayMs(closesInMs)).toBe(LAST_LEAN_LEAD_MS)
  })

  it('[lean] sends a change made in the last moments at once', () => {
    expect(leanDelayMs(100)).toBe(0)
    expect(leanDelayMs(0)).toBe(0)
  })
})
