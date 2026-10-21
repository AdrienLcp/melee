import { POINT } from '@melee/protocol/scoring'

/** What a count landing on the target to the millisecond pays: a typed answer's price. */
export const MOST_A_COUNT_PAYS = 3 * POINT

/**
 * How far off a count may be, as a share of the target, before it pays
 * nothing. Relative because counting error grows with the count: three
 * seconds out on twenty is a worse count than three seconds out on ninety.
 */
export const ZERO_PAY_GAP_SHARE = 0.25

/**
 * What a count pays, from the whole of `MOST_A_COUNT_PAYS` on the dot falling
 * linearly to nothing a quarter of the target away, early or late alike.
 * Rounded once, on a board counted in `POINT`s, so two counts a tenth of a
 * second apart are two scores and the closer one is higher.
 */
export const pointsForGap = ({
  countedMs,
  targetMs
}: {
  countedMs: number
  targetMs: number
}): number => {
  const zeroPayGapMs = targetMs * ZERO_PAY_GAP_SHARE
  const left = 1 - Math.abs(countedMs - targetMs) / zeroPayGapMs

  return Math.round(MOST_A_COUNT_PAYS * Math.max(left, 0))
}

/**
 * How long the server waits for the presses: until a press could only pay
 * nothing. Holding the room past it buys a table staring at a frozen screen
 * and not one point.
 */
export const innerclockRoundDurationMs = (targetMs: number): number =>
  Math.ceil(targetMs * (1 + ZERO_PAY_GAP_SHARE))
