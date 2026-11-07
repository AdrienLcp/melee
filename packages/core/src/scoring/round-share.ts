import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'

/**
 * A share of the round's ceiling, in the board's units: nought pays nothing,
 * one pays the whole round, and anything outside is held to that range. Every
 * rule that prices an answer on a curve or by tiers says its price as a share
 * and lets this turn it into points, so no game can pay past the ceiling.
 */
export const paidShare = (share: number): number =>
  Math.round(MOST_A_ROUND_PAYS * Math.min(Math.max(share, 0), 1))

/** The whole round, two thirds of it or one third: what a ranked answer's best, next and last tier pay. */
export const thirdsOfARound = (thirds: 0 | 1 | 2 | 3): number =>
  paidShare(thirds / 3)
