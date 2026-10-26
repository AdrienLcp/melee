import { POINT } from '@melee/protocol/scoring'

/**
 * How many of the board's units one printed point stands for. The board keeps
 * counting in thousandths of a rule point so the clock ranks three answers
 * inside one second apart; a screen only has to print what a table reads out,
 * and `+12 000` for one round is a number nobody says. A right answer prints
 * as `10`, a typed one `30`, and the clock's share keeps two digits of its
 * own, so two seats tied on screen are still ranked by the millisecond.
 */
const BOARD_UNITS_PER_SHOWN_POINT = POINT / 10

/** A board figure as a screen prints it — never a figure that decides anything. */
export const shownPoints = (points: number): number =>
  Math.round(points / BOARD_UNITS_PER_SHOWN_POINT) + 0
