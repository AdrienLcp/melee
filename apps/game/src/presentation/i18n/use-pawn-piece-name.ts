import type { PawnPiece } from '@melee/protocol/team'

import { useTranslate } from './i18n-provider'
import { pawnColourKey, pawnHeadKey } from './translation'

/** A seat's piece named on this screen: its colour's word, then its head — *Red, square head*. */
export const usePawnPieceName = (): ((piece: PawnPiece) => string) => {
  const translate = useTranslate()

  return (piece) =>
    translate('pawn.piece', {
      colour: translate(pawnColourKey(piece.colour)),
      head: translate(pawnHeadKey(piece.head))
    })
}
