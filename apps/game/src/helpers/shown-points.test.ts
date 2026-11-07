import { describe, expect, it } from 'vitest'

import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { shownPoints } from './shown-points'

describe('shownPoints', () => {
  it('[score] prints a whole round as a hundred', () => {
    expect(shownPoints(MOST_A_ROUND_PAYS)).toBe(100)
    expect(shownPoints(7 * POINT)).toBe(7)
  })

  it('[score] rounds the clock to the nearest printed point', () => {
    expect(shownPoints(14_499)).toBe(14)
    expect(shownPoints(14_500)).toBe(15)
  })

  it('[score] never prints a negative zero', () => {
    expect(Object.is(shownPoints(-40), 0)).toBe(true)
  })
})
