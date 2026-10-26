import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import { shownPoints } from './shown-points'

describe('shownPoints', () => {
  it('[score] prints a rule point as ten', () => {
    expect(shownPoints(POINT)).toBe(10)
    expect(shownPoints(3 * POINT)).toBe(30)
  })

  it('[score] rounds the clock to the nearest printed point', () => {
    expect(shownPoints(1_449)).toBe(14)
    expect(shownPoints(1_450)).toBe(15)
  })

  it('[score] never prints a negative zero', () => {
    expect(Object.is(shownPoints(-40), 0)).toBe(true)
  })
})
