import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoomPhase } from '@melee/protocol/room'

/** What a round's content says about the stage: Petit Bac's alone carries `sheetsClosed`. */
type ContentOnStage = { kind: string; sheetsClosed?: boolean }

/** What a view of the room says about the stage the console and the wall draw. */
export type StageOnScreen = {
  isPaused: boolean
  phase: RoomPhase
  round: { content: ContentOnStage } | null
} | null

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

type StageChange = {
  from: NonNullable<StageOnScreen>
  to: NonNullable<StageOnScreen>
}

/** What a view says about its round's sheets, on any screen. */
export type SheetsOnScreen = { round: { content: ContentOnStage } | null }

/**
 * Whether Petit Bac's sheets close between two views: the same phase, one
 * stage giving way to another, and nobody racing for a press.
 */
export const closesTheSheets = ({
  from,
  to
}: {
  from: SheetsOnScreen
  to: SheetsOnScreen
}): boolean =>
  from.round?.content.sheetsClosed === false &&
  to.round?.content.sheetsClosed === true

/**
 * Whether a snapshot replaces the whole stage the console and the wall draw:
 * every change of phase — the floor changing hands included — a pause taken
 * or lifted, and Petit Bac's sheets closing on the vote, inside `playing`.
 * Each stage arrives on a motion of its own (a round dealt, a reveal struck, a
 * pause card laid, the vote's rows) and none has one for leaving, so the one
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
  (from.phase !== to.phase ||
    from.isPaused !== to.isPaused ||
    closesTheSheets({ from, to }))

const opensTheRace = (change: StageChange): boolean =>
  change.to.phase === 'playing' &&
  !change.to.isPaused &&
  !closesTheSheets(change)

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
 * instead, over a round that answers at once. Petit Bac's vote opening is no
 * race — its sheets are already closed and the vote waits on every seat — so
 * it swaps.
 */
export const consoleStageLanding = ({
  from,
  to
}: {
  from: ConsoleStageOnScreen | null
  to: ConsoleStageOnScreen
}): ViewLanding => {
  if (from === null || !replacesTheStage({ from, to })) {
    return 'drawn'
  }

  return to.youId !== null && opensTheRace({ from, to })
    ? 'faded-over'
    : 'swapped'
}
