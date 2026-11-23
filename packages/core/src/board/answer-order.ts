import { answerPointsOf, type PaidAnswer } from './answer-points'

export type RankedAnswer = PaidAnswer & { isPerfect: boolean }

/**
 * Sorts the better of two answers of one round first: a perfect answer before
 * any other, then the answer's share of what it was paid, and the clock only
 * between two answers alike. Nought is two answers nobody could tell apart,
 * which share a place.
 */
export const byBetterAnswer = (
  left: RankedAnswer,
  right: RankedAnswer
): number =>
  Number(right.isPerfect) - Number(left.isPerfect) ||
  answerPointsOf(right) - answerPointsOf(left) ||
  right.speedBonus - left.speedBonus
