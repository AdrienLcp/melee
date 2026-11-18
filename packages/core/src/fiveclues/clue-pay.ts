import { FIVE_CLUES_CLUE_COUNT } from '@melee/protocol/five-clues'
import { MOST_A_ROUND_PAYS, MOST_THE_CLOCK_PAYS } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'
import type { ClockedPay } from '../scoring/speed-bonus'

/**
 * What finding the country on a clue is worth, the first clue (index 0) the
 * whole round and each later one a fifth less: 100, 80, 60, 40, 20.
 */
export const worthOfClue = (clueIndex: number): number =>
  paidShare((FIVE_CLUES_CLUE_COUNT - clueIndex) / FIVE_CLUES_CLUE_COUNT)

/**
 * A right answer keeps nine tenths of its clue's worth and the clock pays the
 * last tenth, falling linearly over that clue's window, so the seats who found
 * on the same clue are ordered to the millisecond.
 *
 * Unlike `clockedPay`, an answer worth less than the whole round still races:
 * here a later clue is not a worse answer but a later one, and the slowest
 * answer on a clue still out-earns the quickest on the next — 90 against 80,
 * 72 against 60, 54 against 40, 36 against 20.
 */
export const pointsForClue = ({
  clueDurationMs,
  clueIndex,
  elapsedInClueMs,
  paysForSpeed
}: {
  clueDurationMs: number
  /** The clue open when the answer landed, the first one 0. */
  clueIndex: number
  /** How long that clue had been open, on the round's own clock. */
  elapsedInClueMs: number
  /** The room's setting as the round opened: off pays the worth alone. */
  paysForSpeed: boolean
}): ClockedPay => {
  const worth = worthOfClue(clueIndex)

  if (!paysForSpeed || clueDurationMs <= 0) {
    return { points: worth, speedBonus: 0 }
  }

  const clockShare = worth * (MOST_THE_CLOCK_PAYS / MOST_A_ROUND_PAYS)
  const left = Math.min(Math.max(1 - elapsedInClueMs / clueDurationMs, 0), 1)
  const speedBonus = Math.round(clockShare * left)

  return { points: Math.round(worth - clockShare) + speedBonus, speedBonus }
}
