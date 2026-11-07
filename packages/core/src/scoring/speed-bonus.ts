import { MOST_A_ROUND_PAYS, MOST_THE_CLOCK_PAYS } from '@melee/protocol/scoring'

export type ClockedPay = {
  /** Everything the answer was paid, the clock's share included. */
  points: number
  /** How much of `points` the clock paid. */
  speedBonus: number
}

/**
 * What an answer is paid in a round the clock pays: the answer keeps nine
 * tenths of what it earned and the clock pays the last tenth, linear from the
 * whole of it at nought to nothing when the round runs out. Rounded on a board
 * counted in thousandths of a point, so two players a few milliseconds apart
 * are two different scores, the first one higher.
 *
 * **The clock's share is cut from what the answer earned**, never added on top
 * of it: a perfect answer tops out at the round's ceiling, and speed can only
 * reverse two players whose answers are within a tenth of a round of each
 * other. A wrong answer earns nothing, so it earns no speed either.
 *
 * **`elapsedMs` is the round's own clock, never a wall clock.** It stops while
 * the host is away, and a room whose console blinked would otherwise pay the
 * pause. `null` is an answer that was never sent — paid on what the screen held
 * when the round closed, so it ran out, and the clock pays none of it.
 */
export const clockedPay = ({
  earned,
  elapsedMs,
  roundDurationMs
}: {
  /** What the answer is worth on the round's scale, as it would be paid with no clock. */
  earned: number
  /** How far into the round the player first scored, or `null` for an unsent answer. */
  elapsedMs: number | null
  roundDurationMs: number
}): ClockedPay => {
  const clockShare = earned * (MOST_THE_CLOCK_PAYS / MOST_A_ROUND_PAYS)
  const left =
    elapsedMs === null || roundDurationMs <= 0
      ? 0
      : Math.min(Math.max(1 - elapsedMs / roundDurationMs, 0), 1)
  const speedBonus = Math.round(clockShare * left)

  return {
    points: Math.round(earned - clockShare) + speedBonus,
    speedBonus
  }
}
