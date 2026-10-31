import type { Round } from './room'

type HoldFields = Pick<
  Round,
  'isHoldWaived' | 'isReadyHold' | 'settingHoldEndsAt'
>

/**
 * A round as the Durable Object stored it, which may predate the ready hold: a
 * room outlives a deploy, and a round missing these fields put `undefined` on
 * a view the schema refuses, so every screen of that room lost its snapshot.
 * The hold it was counting is the setting's, the only one that existed.
 */
export const withHoldFields = <T extends Pick<Round, 'advancesAt'>>(
  round: T & Partial<HoldFields>
): T & HoldFields => ({
  ...round,
  isHoldWaived: round.isHoldWaived ?? false,
  isReadyHold: round.isReadyHold ?? false,
  settingHoldEndsAt: round.settingHoldEndsAt ?? round.advancesAt
})
