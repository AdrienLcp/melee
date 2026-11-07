import { POINTS_PER_CASE } from '@melee/protocol/board'

import type { BoardStrategyRule } from './board-strategy'

/**
 * A pawn moves one case for every whole `POINTS_PER_CASE` the round paid it,
 * floored, so three at most: a right answer walks three whether the clock paid
 * its share or not. A round that paid less than a case leaves the pawn where
 * it stood.
 */
export const onePointOneCase: BoardStrategyRule = (results) =>
  results.map((result) => ({
    cases: Math.max(0, Math.floor(result.points / POINTS_PER_CASE)),
    pawnId: result.pawnId
  }))
