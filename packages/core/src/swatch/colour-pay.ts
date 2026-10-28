import { type ColourVerdict, POINT } from '@melee/protocol/scoring'

/** What a colour rebuilt to the eye pays: a typed answer's price. */
export const MOST_A_COLOUR_PAYS = 3 * POINT

/**
 * Closer than this pays the whole price: about the smallest gap an eye sees
 * side by side, and the middle of what a sharp memory brings back.
 */
export const FULL_PAY_DISTANCE = 0.02

/**
 * This far or further pays nothing. Measured against the colours the draw
 * deals, a mid grey sent every round lands beyond it nine times in ten, so a
 * seat that remembered nothing does not live off the curve's tail, while a
 * fair memory — the hue within a dozen degrees — still lands inside it.
 */
export const ZERO_PAY_DISTANCE = 0.11

/**
 * What a colour pays, the whole of `MOST_A_COLOUR_PAYS` within
 * `FULL_PAY_DISTANCE` falling linearly to nothing at `ZERO_PAY_DISTANCE`.
 * Rounded once, on a board counted in `POINT`s, so two near misses are two
 * scores and the nearer one is higher.
 */
export const pointsForColour = ({
  distance
}: Pick<ColourVerdict, 'distance'>): number => {
  const left =
    1 - (distance - FULL_PAY_DISTANCE) / (ZERO_PAY_DISTANCE - FULL_PAY_DISTANCE)

  return Math.round(MOST_A_COLOUR_PAYS * Math.min(Math.max(left, 0), 1))
}

export const isExactColour = ({
  distance
}: Pick<ColourVerdict, 'distance'>): boolean => distance <= FULL_PAY_DISTANCE
