import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import { isWholeSheetRight, pointsForPairs } from './pairs-pay'

describe('pointsForPairs', () => {
  it("[higherlower] pays a pick's price per right pair, and banks the sheet only when all five are", () => {
    expect(pointsForPairs({ rightPairs: 0 })).toBe(0)
    expect(pointsForPairs({ rightPairs: 3 })).toBe(3 * POINT)
    expect(isWholeSheetRight({ rightPairs: 4 })).toBe(false)
    expect(isWholeSheetRight({ rightPairs: 5 })).toBe(true)
  })
})
