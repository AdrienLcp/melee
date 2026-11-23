import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'

/**
 * Whether an answer is perfect, read off what it earned before the clock took
 * its share: the whole round, and nothing less. The one test both the clock
 * (only a perfect answer races) and the track (only a perfect answer takes the
 * top step) ask.
 */
export const isPerfectPay = (earned: number): boolean =>
  earned >= MOST_A_ROUND_PAYS
