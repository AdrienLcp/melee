import { z } from 'zod'

import { boardPositionSchema } from './board'
import { playerIdSchema } from './identifiers'

export const MIN_TEAMS = 2
export const MAX_TEAMS = 6

/** As many as the box holds — the pawn tokens a screen draws a team in. */
export const PAWN_COLOUR_COUNT = 8

const teamCountSchema = z.number().int().min(MIN_TEAMS).max(MAX_TEAMS)

/**
 * Whether the room plays in teams, and how its seats get into them. A room
 * setting rather than a game's, by the three-owner test in
 * `docs/game-catalogue.md`: it is true of any game in any mode, and no game's
 * arm learns what a team is — the shell groups the seats and scores the groups.
 *
 * `drawn` has the console deal the seats out; `chosen` lets each seat pick in
 * the lobby. Either way a seat still without a team when a round opens is
 * placed by the late-seat rule, so *Start* never waits on a phone.
 *
 * `teamsOnly` has each team take one seat named after itself, on one phone or
 * on the wall: the server gives every seat a team of its own as it arrives,
 * named after it, so the board and the team scores work as in any other room.
 */
export const teamsSettingsSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('off') }),
  z.object({ count: teamCountSchema, kind: z.literal('drawn') }),
  z.object({ count: teamCountSchema, kind: z.literal('chosen') }),
  z.object({ kind: z.literal('teamsOnly') })
])

export const teamIdSchema = z.string().min(1).max(16)

/** Whom points are paid to by the host's hand: a team, or one seat. */
export const scoreTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('team'), teamId: teamIdSchema }),
  z.object({ kind: z.literal('seat'), playerId: playerIdSchema })
])

export const TEAM_NAME_MAX_LENGTH = 24

export const teamNameSchema = z.string().trim().min(1).max(TEAM_NAME_MAX_LENGTH)

/**
 * Public, and read by every role: a team is never hidden information. The
 * whole roster travels as `seatIds` rather than a team on each player, so a
 * screen drawing a team does not have to regroup the room to do it.
 */
export const teamSchema = z.object({
  /** Its pawn on the track, and `null` in a room whose board is off. */
  board: boardPositionSchema.nullable(),
  /** Its pawn token, 1-based — the team's colour on every screen. */
  colour: z.number().int().min(1).max(PAWN_COLOUR_COUNT),
  id: teamIdSchema,
  /**
   * What the host called it, and `null` until they do — every screen then
   * draws the name its own dictionary gives the colour, so a French phone and
   * an English wall each say it in their language.
   */
  name: teamNameSchema.nullable(),
  /**
   * Every round's team result plus the host's adjustments. A round pays a team
   * the mean of what it paid the seats it opened on, so a team of four is not
   * paid over a team of three for being four.
   */
  score: z.number().int().nonnegative(),
  /** In seat order. Empty is a team still waiting for its first seat. */
  seatIds: z.array(playerIdSchema)
})

export type TeamsSettings = z.infer<typeof teamsSettingsSchema>
export type TeamId = z.infer<typeof teamIdSchema>
export type TeamName = z.infer<typeof teamNameSchema>
export type Team = z.infer<typeof teamSchema>

export const DEFAULT_TEAMS_SETTINGS: TeamsSettings = { kind: 'off' }
