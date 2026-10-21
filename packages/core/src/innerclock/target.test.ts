import { describe, expect, it } from 'vitest'

import {
  MAX_INNERCLOCK_TARGET_SECONDS,
  MIN_INNERCLOCK_TARGET_SECONDS
} from '@melee/protocol/innerclock'

import {
  drawTargetSeconds,
  MAX_DRAWN_TARGET_SECONDS,
  MIN_DRAWN_TARGET_SECONDS
} from './target'

describe('a drawn count', () => {
  it('[innerclock] stays inside the range it states, in whole seconds', () => {
    const draws = Array.from({ length: 500 }, drawTargetSeconds)

    for (const seconds of draws) {
      expect(Number.isInteger(seconds)).toBe(true)
      expect(seconds).toBeGreaterThanOrEqual(MIN_DRAWN_TARGET_SECONDS)
      expect(seconds).toBeLessThanOrEqual(MAX_DRAWN_TARGET_SECONDS)
    }
  })

  it('[innerclock] is a count the wire accepts', () => {
    expect(MIN_DRAWN_TARGET_SECONDS).toBeGreaterThanOrEqual(
      MIN_INNERCLOCK_TARGET_SECONDS
    )
    expect(MAX_DRAWN_TARGET_SECONDS).toBeLessThanOrEqual(
      MAX_INNERCLOCK_TARGET_SECONDS
    )
  })
})
