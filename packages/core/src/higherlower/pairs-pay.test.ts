import { describe, expect, it } from 'vitest'

import { HIGHER_LOWER_PAIR_COUNT } from '@melee/protocol/higher-lower'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'

import { isWholeSheetRight, pointsForPairs } from './pairs-pay'

describe('pointsForPairs', () => {
  it('[higherlower] pays the whole round for the right pick, and banks the sheet only when every pair is', () => {
    expect(pointsForPairs({ rightPairs: 0 })).toBe(0)
    expect(pointsForPairs({ rightPairs: 1 })).toBe(MOST_A_ROUND_PAYS)
    expect(isWholeSheetRight({ rightPairs: HIGHER_LOWER_PAIR_COUNT - 1 })).toBe(
      false
    )
    expect(isWholeSheetRight({ rightPairs: HIGHER_LOWER_PAIR_COUNT })).toBe(
      true
    )
  })
})
