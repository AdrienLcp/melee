import type { CalculationVerdict } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'

/** How far off a calculation earns nothing: six tiles land within ten of almost any target. */
export const MISS_THAT_PAYS_NOTHING = 10

type Distance = Pick<CalculationVerdict, 'distance'>

/**
 * What a seat's nearest calculation earns on the round's scale, before the
 * clock takes its tenth: the whole round for an exact hit, `(10 − d) / 10` of
 * it for a miss of `d`, and nothing from ten away. Only an exact hit earns the
 * whole round, so it alone races for the clock's tenth.
 */
export const pointsForCalculation = ({ distance }: Distance): number =>
  paidShare((MISS_THAT_PAYS_NOTHING - distance) / MISS_THAT_PAYS_NOTHING)

/** Whether a seat made the target itself: nothing nearer can be sent. */
export const isExactHit = ({ distance }: Distance): boolean => distance === 0
