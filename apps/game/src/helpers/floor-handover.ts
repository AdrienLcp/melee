import type { RoundId } from '@melee/protocol/identifiers'
import type { RoomPhase } from '@melee/protocol/room'

/** What every role's view says about the round on screen. */
export type RoundOnScreen = {
  phase: RoomPhase
  round: { id: RoundId } | null
} | null

const FLOOR_PHASES: ReadonlySet<RoomPhase> = new Set(['playing', 'buzzed'])

/**
 * Whether the floor changes hands between two views of the same round: a buzz
 * taking it (`playing → buzzed`) or a verdict handing it back
 * (`buzzed → playing`). A round opening, a reveal and a pause are other
 * moments with motions of their own.
 */
export const handsOverTheFloor = ({
  from,
  to
}: {
  from: RoundOnScreen
  to: RoundOnScreen
}): boolean =>
  from !== null &&
  to !== null &&
  from.round !== null &&
  from.round.id === to.round?.id &&
  from.phase !== to.phase &&
  FLOOR_PHASES.has(from.phase) &&
  FLOOR_PHASES.has(to.phase)
