import type { PawnRoundResult } from './board-strategy'

/** What the round paid a pawn for its answer, the clock's share left out. */
export const answerPointsOf = (result: PawnRoundResult): number =>
  result.points - result.speedBonus
