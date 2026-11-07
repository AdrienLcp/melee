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
 * What one case costs on the track, so a round walks a pawn three cases at
 * most: a right answer is three whether it was fast or slow, because 90 of the
 * round's 100 is already three cases, and the clock's share moves no pawn on
 * its own. An answer worth two thirds walks two.
 */
export const POINTS_PER_CASE = 30 * POINT

export const MIN_BOARD_LENGTH = 10
export const MAX_BOARD_LENGTH = 100

/**
 * Whether the table races on a track, and how. A room setting, because it is
 * true of every game on the line-up, and independent of the teams: a room in
 * teams walks a pawn per team, a room without walks a pawn per seat.
 */
export const boardSettingsSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('off') }),
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

/**
 * Where a pawn stands — a team's or a seat's — public on every screen like the
 * score beside it.
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

export const DEFAULT_BOARD_SETTINGS: BoardSettings = { kind: 'off' }

export const DEFAULT_TRACK_SETTINGS: TrackSettings = {
  catchUp: false,
  kind: 'track',
  length: DEFAULT_BOARD_LENGTH,
  strategy: 'onePointOneCase'
}
