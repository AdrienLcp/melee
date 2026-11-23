import { POINTS_PER_CASE } from '@melee/protocol/board'

import { answerPointsOf } from './answer-points'
import type { BoardStrategyRule } from './board-strategy'

/** The top step, which only a perfect answer walks. */
export const PERFECT_ANSWER_CASES = 3

/** As far as an answer short of perfect walks, however near it came. */
export const IMPERFECT_ANSWER_CASES = 2

/**
 * A perfect answer walks three cases; any other one a case for every whole
 * `POINTS_PER_CASE` its answer earned, floored, and two at most — so a colour
 * a shade off, a pin just short or an order with one pair swapped never lands
 * level with the answer that was right. The clock's share is left out, because
 * it would walk one of two pawns that answered alike a case further for being
 * quicker.
 */
export const onePointOneCase: BoardStrategyRule = (results) =>
  results.map((result) => ({
    cases: result.isPerfect
      ? PERFECT_ANSWER_CASES
      : Math.min(
          IMPERFECT_ANSWER_CASES,
          Math.max(0, Math.floor(answerPointsOf(result) / POINTS_PER_CASE))
        ),
    pawnId: result.pawnId
  }))
