import { POINTS_PER_CASE } from '@melee/protocol/board'

import { answerPointsOf } from './answer-points'
import type { BoardStrategyRule } from './board-strategy'

const CASES_BY_PLACE = [3, 2, 1] as const

/**
 * The round's ranking walks the pawns 3, 2 and 1 cases. Ranked on what the
 * round paid, speed bonus included, so a tie is two pawns equally right *and*
 * equally quick; a tie shares the better place and the place after it is
 * skipped, as a podium counts.
 *
 * Only a pawn whose answer earned a case's worth stands on it: a podium of
 * three among pawns that answered nothing worth a case would walk a far-off
 * guess as far as a right one. That also leaves out the teams waiting for
 * their turn in a set, paid nothing, so a turn never ranks one team against
 * teams that never played it.
 */
export const rank: BoardStrategyRule = (results) => {
  const contenders = results.filter(
    (result) => answerPointsOf(result) >= POINTS_PER_CASE
  )

  return results.map((result) => {
    const place = contenders.filter(
      (other) => other.points > result.points
    ).length

    return {
      cases: contenders.includes(result) ? (CASES_BY_PLACE[place] ?? 0) : 0,
      pawnId: result.pawnId
    }
  })
}
