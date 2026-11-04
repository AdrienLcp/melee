import type { BoardPosition, BoardSettings } from '@melee/protocol/board'
import type { RoomSettings } from '@melee/protocol/room'

/**
 * Whether a pawn stands on the last case, which ends an evening raced to the
 * finish (`racesToTheFinish`) at this reveal. Read through `endsTheEvening`
 * by the server's final-round test and by every screen that offers *Next
 * round*, so none offers one the server would answer with the final board.
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

/**
 * Whether the evening is *first home wins*: a track, no round count, and the
 * finish set to end it. A counted evening ends on its count alone, and an
 * endless one when the host says, a pawn home or not.
 */
export const racesToTheFinish = (
  settings: Pick<RoomSettings, 'board' | 'endsAtFinish' | 'roundCount'>
): boolean =>
  settings.board.kind === 'track' &&
  settings.roundCount === null &&
  settings.endsAtFinish
