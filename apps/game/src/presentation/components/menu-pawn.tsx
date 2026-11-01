import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { pawnColourKey } from '@/presentation/i18n/translation'

import { Disclosure } from './disclosure'
import { Pawn } from './pawn'
import { PawnColourPicker } from './pawn-colour-picker'
import { useOwnPawn } from './use-own-pawn'

/**
 * *My pawn*, under the name in the menu, at every phase: the row carries the
 * pawn and its colour, and opens on the twelve. A round in play holds them,
 * saying why, since the server refuses a recolour then.
 */
export const MenuPawn: React.FC = () => {
  const pawn = useOwnPawn()
  const translate = useTranslate()

  if (pawn === null) {
    return null
  }

  const { team: _team, ...picker } = pawn

  return (
    <Disclosure
      className='menu-pawn'
      icon={<Pawn colour={pawn.colour} />}
      label={pawn.label}
      summary={translate(pawnColourKey(pawn.colour))}
    >
      <PawnColourPicker {...picker} isLabelHidden />
    </Disclosure>
  )
}
