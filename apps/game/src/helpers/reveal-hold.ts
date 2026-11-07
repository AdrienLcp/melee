import {
  READY_HOLD_MS,
  type RoomSettings,
  type RoundView
} from '@melee/protocol/room'

/**
 * How long the wait counting this reveal down lasts, which the bar draws its
 * drain against: the ready hold when every seat armed it, the setting's
 * otherwise. `null` when nothing is counting.
 *
 * The server counts to the next round's first note, and the next round's
 * countdown takes the last `countdownMs` of that wait on every screen — so the
 * bar ends where the countdown starts, or two counts would overlap and the
 * bar would vanish mid-way. The final reveal has no countdown after it.
 */
export const revealHoldOf = ({
  round,
  settings
}: {
  round: Pick<RoundView, 'advancesAt' | 'isFinal' | 'isReadyHold'>
  settings: Pick<RoomSettings, 'autoAdvanceMs' | 'countdownMs'>
}): { advancesAt: number; holdMs: number } | null => {
  const fullHoldMs = round.isReadyHold ? READY_HOLD_MS : settings.autoAdvanceMs

  if (round.advancesAt === null || fullHoldMs === null) {
    return null
  }

  const countdownMs = round.isFinal ? 0 : settings.countdownMs
  const holdMs = fullHoldMs - countdownMs

  return holdMs > 0
    ? { advancesAt: round.advancesAt - countdownMs, holdMs }
    : null
}
