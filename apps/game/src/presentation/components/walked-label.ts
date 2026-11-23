import type { BoardPosition } from '@melee/protocol/board'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useTrackLength } from './board-kind'

/**
 * What the round walked a pawn, the way a reveal prints it: _+2 cases_, _+0
 * case_ for a seat that answered and walked nothing, and the finish's own
 * word for a pawn the finish stopped — its answer may have earned more than
 * the cases left, and _+1 case_ beside a perfect answer reads as a punishment.
 */
export const useWalkedLabel = (): ((board: BoardPosition) => string) => {
  const translate = useTranslate()
  const length = useTrackLength()

  return (board) =>
    length !== null && board.move > 0 && board.case >= length
      ? translate('board.finish')
      : translate('board.walkedSquares', { count: board.move })
}
