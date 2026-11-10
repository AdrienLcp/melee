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
 * **Only a perfect answer races.** An imperfect one keeps its nine tenths and
 * the clock pays it nothing, so a better answer is always paid more, however
 * late: every imperfect answer lands under 90 and every perfect one at 90 or
 * above. A clock share scaled to what the answer earned let a pin 140 km off a
 * country placed at once beat one inside it placed last — **do not pay a
 * partial answer for speed again**. A wrong answer earns nothing, so it earns
 * no speed either.
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
  const isPerfect = earned >= MOST_A_ROUND_PAYS
  const left =
    !isPerfect || elapsedMs === null || roundDurationMs <= 0
      ? 0
      : Math.min(Math.max(1 - elapsedMs / roundDurationMs, 0), 1)
  const speedBonus = Math.round(clockShare * left)

  return {
    points: Math.round(earned - clockShare) + speedBonus,
    speedBonus
  }
}
