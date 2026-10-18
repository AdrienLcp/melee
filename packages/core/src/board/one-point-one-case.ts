import { POINT } from '@melee/protocol/scoring'

import type { BoardStrategyRule } from './board-strategy'

/**
 * A team moves one case for every whole `POINT` the round paid it, floored:
 * the speed bonus breaks ties on the standings and moves no pawn on its own
 * (open decision 3). A round that paid less than a point leaves the pawn where
 * it stood.
 */
export const onePointOneCase: BoardStrategyRule = (results) =>
  results.map((result) => ({
    cases: Math.max(0, Math.floor(result.points / POINT)),
    teamId: result.teamId
  }))
