import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { pawnColourKey } from '@/presentation/i18n/translation'
import { usePawnPieceName } from '@/presentation/i18n/use-pawn-piece-name'

import { Disclosure } from './disclosure'
import { Pawn } from './pawn'
import { PawnPiecePicker } from './pawn-piece-picker'
import { useOwnPawn } from './use-own-pawn'

/**
 * *My pawn*, under the name in the menu, at every phase: the row carries the
 * pawn and its name — a seat's colour and head, a team's colour — and opens on
 * the pieces. A round in play holds them, saying why, since the server
 * refuses a change then.
 */
export const MenuPawn: React.FC = () => {
  const pawn = useOwnPawn()
  const translate = useTranslate()
  const pieceName = usePawnPieceName()

  if (pawn === null) {
    return null
  }

  const { team, ...picker } = pawn

  return (
    <Disclosure
      className='menu-pawn'
      icon={<Pawn colour={pawn.piece.colour} head={pawn.piece.head} />}
      label={pawn.label}
      summary={
        team === null
          ? pieceName(pawn.piece)
          : translate(pawnColourKey(pawn.piece.colour))
      }
    >
      <PawnPiecePicker {...picker} isLabelHidden />
    </Disclosure>
  )
}
