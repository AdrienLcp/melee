import type { BoardPosition, BoardSettings } from '@melee/protocol/board'

/**
 * Whether a pawn stands on the last case, which ends the evening at this
 * reveal however many rounds were planned. Read by the server's final-round
 * test and by every screen that offers *Next round*, so none offers one the
 * server would answer with the final board.
 *
 * The pawns are the teams' in a room that plays in teams and the seats'
 * otherwise; a caller hands over both and the off ones carry `null`.
 */
export const isTrackFinished = ({
  board,
  pawns
}: {
  board: BoardSettings
  pawns: readonly { board: BoardPosition | null }[]
}): boolean =>
  board.kind === 'track' &&
  pawns.some((pawn) => (pawn.board?.case ?? 0) >= board.length)
