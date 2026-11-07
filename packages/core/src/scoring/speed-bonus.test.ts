import { describe, expect, it } from 'vitest'

import {
  MOST_A_ROUND_PAYS,
  MOST_THE_CLOCK_PAYS,
  POINT
} from '@melee/protocol/scoring'

import { clockedPay } from './speed-bonus'

const THIRTY_SECONDS = 30_000

const paidAt = (
  elapsedMs: number | null,
  earned = MOST_A_ROUND_PAYS
): ReturnType<typeof clockedPay> =>
  clockedPay({ earned, elapsedMs, roundDurationMs: THIRTY_SECONDS })

describe('clockedPay', () => {
  it('[scoring] pays the whole round at nought and nine tenths of it at the end', () => {
    expect(paidAt(0)).toEqual({
      points: MOST_A_ROUND_PAYS,
      speedBonus: MOST_THE_CLOCK_PAYS
    })
    expect(paidAt(THIRTY_SECONDS)).toEqual({
      points: 90 * POINT,
      speedBonus: 0
    })
  })

  /**
   * The case the rank table could not price, and the reason it went: one second
   * against twenty-nine used to be worth 2 against 1.
   */
  it('[scoring] separates one second from twenty-nine', () => {
    expect(paidAt(1_000).speedBonus).toBe(9_667)
    expect(paidAt(29_000).speedBonus).toBe(333)
  })

  it('[scoring] falls with the clock rather than with the order', () => {
    expect(paidAt(THIRTY_SECONDS / 4).speedBonus).toBe(7_500)
    expect(paidAt(THIRTY_SECONDS / 2).speedBonus).toBe(5_000)
    expect(paidAt((THIRTY_SECONDS * 3) / 4).speedBonus).toBe(2_500)
  })

  /**
   * Three quick players inside one second, which whole points used to pay the
   * same: the first of them has to come out ahead.
   */
  it('[scoring] separates three answers inside the same second, the first highest', () => {
    const [first, second, third] = [8_100, 8_150, 8_900].map(
      (elapsedMs) => paidAt(elapsedMs).points
    )

    expect(first).toBeGreaterThan(second ?? 0)
    expect(second).toBeGreaterThan(third ?? 0)
  })

  /** The clock is a tenth of what the answer earned, so half an answer races for half a tenth. */
  it('[scoring] scales the clock with what the answer earned', () => {
    expect(paidAt(0, 50 * POINT)).toEqual({
      points: 50 * POINT,
      speedBonus: 5 * POINT
    })
    expect(paidAt(0, 0)).toEqual({ points: 0, speedBonus: 0 })
  })

  /** Speed reverses two answers within a tenth of a round, never two further apart. */
  it('[scoring] lets no speed beat an answer more than a tenth of a round better', () => {
    const slowButRight = paidAt(THIRTY_SECONDS - 1).points
    const fastButOff = paidAt(0, 89 * POINT).points

    expect(slowButRight).toBeGreaterThan(fastButOff)
  })

  /** An answer the screen held when the round closed ran out: the clock pays none of it. */
  it('[scoring] pays an unsent answer no speed', () => {
    expect(paidAt(null)).toEqual({ points: 90 * POINT, speedBonus: 0 })
  })
})
