import type { BoardSettings } from '@melee/protocol/board'
import type { Team } from '@melee/protocol/team'

/**
 * Whether a pawn stands on the last case, which ends the evening at this
 * reveal however many rounds were planned. Read by the server's final-round
 * test and by every screen that offers *Next round*, so none offers one the
 * server would answer with the final board.
 */
export const isTrackFinished = ({
  board,
  teams
}: {
  board: BoardSettings
  teams: readonly Team[]
}): boolean =>
  board.kind === 'track' &&
  teams.some((team) => (team.board?.case ?? 0) >= board.length)
