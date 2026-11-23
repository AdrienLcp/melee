/** What a round paid, and how much of it the clock did. */
export type PaidAnswer = {
  points: number
  speedBonus: number
}

/** What the round paid a pawn for its answer, the clock's share left out. */
export const answerPointsOf = (result: PaidAnswer): number =>
  result.points - result.speedBonus
