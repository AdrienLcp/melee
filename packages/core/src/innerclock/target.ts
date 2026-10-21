import { randomIntBetween } from '../helpers/random'

/**
 * The count a round opens on unless the host types another: drawn afresh for
 * every round, never remembered, and drawn again by the console's die. Twenty
 * is long enough that a count is a count rather than a guess; a minute is as
 * long as a table stays silent round after round (Adrien, 21/10/2026).
 */
export const MIN_DRAWN_TARGET_SECONDS = 20
export const MAX_DRAWN_TARGET_SECONDS = 60

export const drawTargetSeconds = (): number =>
  randomIntBetween(MIN_DRAWN_TARGET_SECONDS, MAX_DRAWN_TARGET_SECONDS)
