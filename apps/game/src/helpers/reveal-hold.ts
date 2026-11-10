import {
  READY_HOLD_MS,
  type RoomSettings,
  type RoundView
} from '@melee/protocol/room'

/** A wait between a reveal and the next round, as the screens draw it. */
export type RevealHoldSpan = {
  /** Server time the wait ends, the next round's countdown excluded. */
  advancesAt: number
  /** The whole wait, from the setting its deadline was stamped against. */
  holdMs: number
}

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
}): RevealHoldSpan | null => {
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

/**
 * Whether the wait a table all ready armed fills the Ready press rather than
 * drawing a bar over it. A bar arriving above the press pushes it out from
 * under the finger that just pressed it, so the press fills instead — unless
 * the room's own hold already drew its bar from the reveal on, which then keeps
 * counting rather than leaving and lifting the page back up.
 */
export const isHoldInReadyPress = ({
  round,
  settings
}: {
  round: Pick<RoundView, 'advancesAt' | 'isFinal' | 'isReadyHold'>
  settings: Pick<RoomSettings, 'autoAdvanceMs' | 'countdownMs'>
}): boolean =>
  round.isReadyHold &&
  revealHoldOf({ round: { ...round, isReadyHold: false }, settings }) === null
