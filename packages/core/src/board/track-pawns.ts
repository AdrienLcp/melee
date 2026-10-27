import type { BoardPosition } from '@melee/protocol/board'
import type { ScoreTarget } from '@melee/protocol/client-message'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Team, TeamId } from '@melee/protocol/team'

/**
 * One pawn on the track: a team's in a room that plays in teams, a seat's
 * otherwise. A seat carries its place in the roster, which picks its colour.
 */
export type TrackPawn =
  | { board: BoardPosition; id: TeamId; kind: 'team'; team: Team }
  | {
      board: BoardPosition
      id: PlayerId
      kind: 'seat'
      player: PublicPlayer
      seat: number
    }

/**
 * Every pawn standing on the track, in the roster's order. The server gives a
 * position to the teams or to the seats and never to both, so whichever holds
 * one is what walks — and a board that is off leaves nothing.
 */
export const trackPawnsOf = ({
  players,
  teams
}: {
  players: readonly PublicPlayer[]
  teams: readonly Team[]
}): TrackPawn[] => [
  ...teams.flatMap((team): TrackPawn[] =>
    team.board === null
      ? []
      : [{ board: team.board, id: team.id, kind: 'team', team }]
  ),
  ...players.flatMap((player, seat): TrackPawn[] =>
    player.board === null
      ? []
      : [{ board: player.board, id: player.id, kind: 'seat', player, seat }]
  )
]

/** The leader first; pawns on one case keep the roster's order. */
export const rankTrackPawns = (pawns: readonly TrackPawn[]): TrackPawn[] =>
  pawns.toSorted((a, b) => b.board.case - a.board.case)

/**
 * The leader first, each pawn with the place a podium stands it on: pawns on
 * one case share it and the place after them is skipped, as the scoreboard
 * counts — so a table nobody has walked yet is first to a pawn.
 */
export const placeTrackPawns = (
  pawns: readonly TrackPawn[]
): { pawn: TrackPawn; place: number }[] =>
  rankTrackPawns(pawns).map((pawn, _at, ranked) => ({
    pawn,
    place: ranked.findIndex((other) => other.board.case === pawn.board.case) + 1
  }))

/** Whose score a hand-made move goes through: the server walks that pawn with it. */
export const scoreTargetOf = (pawn: TrackPawn): ScoreTarget =>
  pawn.kind === 'team'
    ? { kind: 'team', teamId: pawn.id }
    : { kind: 'seat', playerId: pawn.id }
