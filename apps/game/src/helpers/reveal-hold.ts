import {
  READY_HOLD_MS,
  type RoomSettings,
  type RoundView
} from '@melee/protocol/room'

/**
 * How long the wait counting this reveal down lasts, which the bar draws its
 * drain against: the ready hold when every seat armed it, the setting's
 * otherwise. `null` when nothing is counting.
 */
export const revealHoldOf = ({
  round,
  settings
}: {
  round: Pick<RoundView, 'advancesAt' | 'isReadyHold'>
  settings: Pick<RoomSettings, 'autoAdvanceMs'>
}): { advancesAt: number; holdMs: number } | null => {
  const holdMs = round.isReadyHold ? READY_HOLD_MS : settings.autoAdvanceMs

  return round.advancesAt === null || holdMs === null
    ? null
    : { advancesAt: round.advancesAt, holdMs }
}
