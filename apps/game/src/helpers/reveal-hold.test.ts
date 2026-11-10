import { describe, expect, it } from 'vitest'

import { isHoldInReadyPress } from './reveal-hold'

const readyHold = { advancesAt: 10_000, isFinal: false, isReadyHold: true }

describe('isHoldInReadyPress', () => {
  it('[hold] fills the press when nothing counted before the table was ready', () => {
    expect(
      isHoldInReadyPress({
        round: readyHold,
        settings: { autoAdvanceMs: null, countdownMs: 3_000 }
      })
    ).toBe(true)
  })

  it('[hold] keeps the bar the room hold already drew from the reveal', () => {
    expect(
      isHoldInReadyPress({
        round: readyHold,
        settings: { autoAdvanceMs: 15_000, countdownMs: 3_000 }
      })
    ).toBe(false)
  })

  it('[hold] fills the press when the room hold was all countdown and drew no bar', () => {
    expect(
      isHoldInReadyPress({
        round: readyHold,
        settings: { autoAdvanceMs: 3_000, countdownMs: 3_000 }
      })
    ).toBe(true)
  })

  it('[hold] leaves the room hold alone before every seat is ready', () => {
    expect(
      isHoldInReadyPress({
        round: { ...readyHold, isReadyHold: false },
        settings: { autoAdvanceMs: null, countdownMs: 3_000 }
      })
    ).toBe(false)
  })
})
