import { z } from 'zod'

import { POINT } from './scoring'

/**
 * The scoring strategies a track can run, each a file of its own in
 * `@melee/core/board/`: a case per `POINTS_PER_CASE` the round paid, or 3, 2 and
 * 1 cases by the round's team ranking. The next is a new literal here and a
 * new file there, and nothing else learns its name.
 */
export const boardStrategySchema = z.enum(['onePointOneCase', 'rank'])

/**
 * What one case costs on the track, counted on the answer's share of the round
 * and never the clock's: a right answer is three cases fast or slow, two
 * thirds of one is two, and a third is one, so two pawns that answered alike
 * walk alike whoever was quicker.
 */
export const POINTS_PER_CASE = 30 * POINT

export const MIN_BOARD_LENGTH = 10
export const MAX_BOARD_LENGTH = 100

/**
 * A board stored before it said `points` called it `off`, and a table opened
 * then is still read through today's schema.
 */
const withPointsForOff = (stored: unknown): unknown =>
  typeof stored === 'object' &&
  stored !== null &&
  'kind' in stored &&
  stored.kind === 'off'
    ? { kind: 'points' }
    : stored

/**
 * What the table plays for, never both: points, printed on every screen, or a
 * race on a track where only the pawns and their cases show. A room setting,
 * because it is true of every game on the line-up, and independent of the
 * teams: a room in teams walks a pawn per team, a room without a pawn per seat.
 */
export const boardSettingsSchema = z.preprocess(
  withPointsForOff,
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('points') }),
    z.object({
      /**
       * A team alone at the back moves one case more on a round that walks it.
       * Defaulted, because a host's stored track predates it and must not be
       * thrown away for lacking it.
       */
      catchUp: z.boolean().default(false),
      kind: z.literal('track'),
      /** In cases; the first pawn to reach the last one ends the evening. */
      length: z.number().int().min(MIN_BOARD_LENGTH).max(MAX_BOARD_LENGTH),
      strategy: boardStrategySchema
    })
  ])
)

/**
 * Where a pawn stands — a team's or a seat's — public on every screen, and on
 * a track the only standing a screen prints.
 * `move` is what the round on screen walked it, so a screen can play the walk
 * from `case - move` rather than teleport the pawn — nought until the reveal,
 * because a pawn that moves mid-round is an answer given away.
 */
export const boardPositionSchema = z.object({
  /** 0 is the start, `length` the finish. */
  case: z.number().int().nonnegative(),
  move: z.number().int().nonnegative()
})

export type BoardStrategy = z.infer<typeof boardStrategySchema>
export type BoardSettings = z.infer<typeof boardSettingsSchema>
export type BoardPosition = z.infer<typeof boardPositionSchema>
export type TrackSettings = Extract<BoardSettings, { kind: 'track' }>

export const DEFAULT_BOARD_LENGTH = 40

export const DEFAULT_BOARD_SETTINGS: BoardSettings = { kind: 'points' }

export const DEFAULT_TRACK_SETTINGS: TrackSettings = {
  catchUp: false,
  kind: 'track',
  length: DEFAULT_BOARD_LENGTH,
  strategy: 'onePointOneCase'
}
