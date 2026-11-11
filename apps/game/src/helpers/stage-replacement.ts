import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoomPhase } from '@melee/protocol/room'

/** What a view of the room says about the stage the console and the wall draw. */
export type StageOnScreen = { isPaused: boolean; phase: RoomPhase } | null

/** The same, on a console that may hold a seat. */
export type ConsoleStageOnScreen = NonNullable<StageOnScreen> & {
  youId: PlayerId | null
}

/**
 * How a snapshot lands on a screen:
 * - `swapped` — one screen replacing another, through a view transition that
 *   holds every press for its length;
 * - `faded-over` — what was drawn fades off a still copy over what comes in,
 *   which takes presses from its first frame;
 * - `drawn` — as it comes.
 */
export type ViewLanding = 'drawn' | 'faded-over' | 'swapped'

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

const opensTheRace = (to: NonNullable<StageOnScreen>): boolean =>
  to.phase === 'playing' && !to.isPaused

/**
 * The wall's stage: every replacement swaps, since nothing on it is pressed —
 * the first view too, which takes the place of the line saying the room is
 * on its way.
 */
export const wallStageLanding = (change: {
  from: StageOnScreen
  to: StageOnScreen
}): ViewLanding =>
  change.from === null || replacesTheStage(change) ? 'swapped' : 'drawn'

/**
 * The console's stage, swapped as the wall's is — save where the replacement
 * opens the race to a console holding a seat: the round dealt, the floor
 * given back, the pause lifted. A swap would hold that seat's first press
 * while every other screen takes theirs, so the stage left fades off a copy
 * instead, over a round that answers at once.
 */
export const consoleStageLanding = ({
  from,
  to
}: {
  from: ConsoleStageOnScreen | null
  to: ConsoleStageOnScreen
}): ViewLanding => {
  if (!replacesTheStage({ from, to })) {
    return 'drawn'
  }

  return to.youId !== null && opensTheRace(to) ? 'faded-over' : 'swapped'
}
