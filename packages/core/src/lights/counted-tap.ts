import type { LightsCell } from '@melee/protocol/lights'

import type { LightsStep } from './lights-run'

/**
 * Hit _n_ (from one) is counted only from `opensAt + n × HIT_FLOOR_MS`:
 * `FALSE_START_FLOOR_MS`'s twin, applied to every hit of a window rather than
 * to one press. Cumulative on purpose — Wi-Fi bunches frames, so a floor
 * between two arrivals would refuse honest hits, while a script firing every
 * step at once still meets it. Ten a second is past any thumb.
 */
export const HIT_FLOOR_MS = 100

/** How long after `closesAt` a tap is still counted: the last ones are still in the air. */
export const LATE_TAP_GRACE_MS = 400

/** How long a trap darkens the board, on the screen alone: the score is hits, and a trap costs only this. */
export const TRAP_FREEZE_MS = 1_000

/** How long a miss darkens the board: without it, sweeping a hand over all nine cells is the best play. */
export const MISS_FREEZE_MS = 300

/** The round's window, in server time, published with the countdown. */
export type LightsWindow = {
  closesAt: number
  opensAt: number
}

/** A tap as the server received it: `arrivedAt` is its own stamp, never the screen's. */
export type LightsTap = {
  arrivedAt: number
  cell: LightsCell
  step: number
}

/**
 * - `hit` — counted, the seat moves to its next step;
 * - `trap` — recorded for the wall, and moves nothing;
 * - `uncounted` — outside the window, under the floor, not the seat's next
 *   step, or neither the target nor the trap.
 */
export type TapOutcome = 'hit' | 'trap' | 'uncounted'

/** The most a seat can be counted, and so the run's length: the floor reaches past the grace after it. */
export const lightsRunLengthOf = (windowMs: number): number =>
  Math.floor((windowMs + LATE_TAP_GRACE_MS) / HIT_FLOOR_MS)

/**
 * What one tap does to a seat that has `hits` so far, whose next step is
 * therefore `hits`. A step already passed is a frame repeated by a reconnect,
 * and counts nothing a second time.
 */
export const tapOutcomeOf = ({
  hits,
  run,
  tap,
  window
}: {
  hits: number
  run: readonly LightsStep[]
  tap: LightsTap
  window: LightsWindow
}): TapOutcome => {
  const chased = run[tap.step]

  if (
    chased === undefined ||
    tap.step !== hits ||
    tap.arrivedAt < window.opensAt ||
    tap.arrivedAt > window.closesAt + LATE_TAP_GRACE_MS
  ) {
    return 'uncounted'
  }

  if (tap.cell === chased.trap) {
    return 'trap'
  }

  const floor = window.opensAt + (hits + 1) * HIT_FLOOR_MS

  return tap.cell === chased.target && tap.arrivedAt >= floor
    ? 'hit'
    : 'uncounted'
}
