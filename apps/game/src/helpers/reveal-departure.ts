import type { RoundId } from '@melee/protocol/identifiers'
import type { RoomPhase } from '@melee/protocol/room'

/** What every role's view says about the round on screen. */
export type RoundOnScreen = {
  phase: RoomPhase
  round: { id: RoundId } | null
} | null

/**
 * Whether a snapshot takes the reveal off the screen — the next round's
 * countdown, the final board, the lobby of a game played again. Arriving at
 * the reveal has its own motion (`page-enter` from a little large); leaving it has none of its
 * own, so the stage it gives way to replaces it as one screen replacing
 * another.
 */
export const leavesTheReveal = ({
  from,
  to
}: {
  from: RoundOnScreen
  to: RoundOnScreen
}): boolean =>
  from !== null &&
  to !== null &&
  from.phase === 'revealed' &&
  to.phase !== 'revealed'
