import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { usePawnPieceName } from '@/presentation/i18n/use-pawn-piece-name'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import { PawnPiecePress } from './pawn-piece-press'
import { useOwnPawn } from './use-own-pawn'

/**
 * The colour press on this screen's own row, or on its own team's head: the
 * same pawn the menu's *My pawn* repaints, one press from the roster.
 */
export const OwnPawnPress: React.FC = () => {
  const pawn = useOwnPawn()
  const translate = useTranslate()
  const teamName = useTeamName()
  const pieceName = usePawnPieceName()

  if (pawn === null) {
    return null
  }

  const { team, ...picker } = pawn

  return (
    <PawnPiecePress
      {...picker}
      aria-label={
        team === null
          ? translate('pawn.press.seat', { piece: pieceName(pawn.piece) })
          : translate('team.recolour.action', { team: teamName(team) })
      }
    />
  )
}
