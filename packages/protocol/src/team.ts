import { z } from 'zod'

import { boardPositionSchema } from './board'
import { playerIdSchema } from './identifiers'
import { verdictSchema } from './scoring'

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
 * `aloud` is a table with no phone at all: the teams are named on the console,
 * no screen takes a seat, the wall shows the question and the host taps the
 * teams that had it (`host.awardTeams`). A game that needs a screen in every
 * hand cannot be ticked under it — see `isPlayableAloud`.
 */
export const teamsSettingsSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('off') }),
  z.object({ count: teamCountSchema, kind: z.literal('drawn') }),
  z.object({ count: teamCountSchema, kind: z.literal('chosen') }),
  z.object({ count: teamCountSchema, kind: z.literal('aloud') })
])

/**
 * How a round's seats add up to the team's result. `sum` pays the team every
 * point its seats made, so no answer ever costs it anything; `balanced` pays
 * the mean over the seats the round opened on, so a team of three does not
 * outscore a team of one by being three. Balanced is the default because a
 * table rarely splits evenly, and a sum hands the larger team the evening.
 */
export const teamScoringSchema = z.enum(['sum', 'balanced'])

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
  /**
   * What the round on screen paid it, and nought until the reveal: no screen
   * can add it up from the seats' awards once the teams average them or
   * answer as one.
   */
  gain: z.number().int().nonnegative(),
  id: teamIdSchema,
  /**
   * What the host called it, and `null` until they do — every screen then
   * draws the name its own dictionary gives the colour, so a French phone and
   * an English wall each say it in their language.
   */
  name: teamNameSchema.nullable(),
  /**
   * Every round's team result plus the host's adjustments. A round pays a team
   * what it paid the seats it opened on, added up or averaged as
   * `teamScoring` says, and a team answering as one — a turn, a challenge's
   * placing — that answer once.
   */
  score: z.number().int().nonnegative(),
  /** In seat order. Empty is a team still waiting for its first seat. */
  seatIds: z.array(playerIdSchema)
})

/**
 * The host's word on what one team had right in a round played aloud, in the
 * shape the game is judged in — the title and the artist apart in a blind test.
 */
export const teamVerdictSchema = z.object({
  teamId: teamIdSchema,
  verdict: verdictSchema
})

export type TeamScoring = z.infer<typeof teamScoringSchema>
export type TeamVerdict = z.infer<typeof teamVerdictSchema>
export type TeamsSettings = z.infer<typeof teamsSettingsSchema>
export type TeamId = z.infer<typeof teamIdSchema>
export type TeamName = z.infer<typeof teamNameSchema>
export type Team = z.infer<typeof teamSchema>

export const DEFAULT_TEAMS_SETTINGS: TeamsSettings = { kind: 'off' }

export const DEFAULT_TEAM_SCORING: TeamScoring = 'balanced'
