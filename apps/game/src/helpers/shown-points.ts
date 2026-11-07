import { POINT } from '@melee/protocol/scoring'

/**
 * A board figure as a screen prints it — never a figure that decides anything.
 * The board counts in thousandths of a point so the clock ranks three answers
 * inside one second apart; a screen prints what a table reads out, a round
 * being worth 100 at most, and two seats tied on screen are still ranked by
 * the millisecond underneath.
 */
export const shownPoints = (points: number): number =>
  Math.round(points / POINT) + 0
