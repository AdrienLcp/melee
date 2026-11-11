import type { RoomPhase } from '@melee/protocol/room'

/** What a view of the room says about the stage the console and the wall draw. */
export type StageOnScreen = { isPaused: boolean; phase: RoomPhase } | null

/**
 * Whether a snapshot replaces the whole stage the console and the wall draw:
 * every change of phase — the floor changing hands included — and a pause
 * taken or lifted. Each stage arrives on a motion of its own (a round dealt, a
 * reveal struck, a pause card laid) and none has one for leaving, so the one
 * left fades off over it rather than vanishing in a frame.
 */
export const replacesTheStage = ({
  from,
  to
}: {
  from: StageOnScreen
  to: StageOnScreen
}): boolean =>
  from !== null &&
  to !== null &&
  (from.phase !== to.phase || from.isPaused !== to.isPaused)
