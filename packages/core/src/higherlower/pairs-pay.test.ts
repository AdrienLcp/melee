import { describe, expect, it } from 'vitest'

import { HIGHER_LOWER_PAIR_COUNT } from '@melee/protocol/higher-lower'
import { POINT } from '@melee/protocol/scoring'

import { isWholeSheetRight, pointsForPairs } from './pairs-pay'

describe('pointsForPairs', () => {
  it("[higherlower] pays a pick's price per right pair, and banks the sheet only when every pair is", () => {
    expect(pointsForPairs({ rightPairs: 0 })).toBe(0)
    expect(pointsForPairs({ rightPairs: 3 })).toBe(3 * POINT)
    expect(isWholeSheetRight({ rightPairs: HIGHER_LOWER_PAIR_COUNT - 1 })).toBe(
      false
    )
    expect(isWholeSheetRight({ rightPairs: HIGHER_LOWER_PAIR_COUNT })).toBe(
      true
    )
  })
})
