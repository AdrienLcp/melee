import { POINTS_PER_CASE } from '@melee/protocol/board'

import { answerPointsOf } from './answer-points'
import type { BoardStrategyRule } from './board-strategy'

/**
 * A pawn moves one case for every whole `POINTS_PER_CASE` its answer earned,
 * floored, so three at most. The clock's share is left out, because it would
 * walk one of two pawns that answered alike a case further for being quicker.
 */
export const onePointOneCase: BoardStrategyRule = (results) =>
  results.map((result) => ({
    cases: Math.max(0, Math.floor(answerPointsOf(result) / POINTS_PER_CASE)),
    pawnId: result.pawnId
  }))
