import type React from 'react'

import type { BoardPosition } from '@melee/protocol/board'

import { Button } from '@/presentation/components/button'
import { MinusIcon, PlusIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './team-leaflet.sass'
import './team-move.sass'

type TeamMoveProps = {
  /** The track's last case, which the readout counts towards. */
  length: number
  /**
   * Walks the pawn a case either way, through its team's or its seat's score.
   * Absent on a screen that moves nothing, which reads the move and offers no
   * press.
   */
  onAdjust?: (cases: 1 | -1) => void
  /** Whom the pawn stands for, in the presses' accessible names. */
  name: string
  /** Where the pawn stands; `null` draws nothing, as on a board that is off. */
  position: BoardPosition | null
}

/**
 * What the round walked a pawn and where it stands now, under its name: the line the table checks before *Next round*, and the one
 * place the host puts a miscounted case right.
 */
export const TeamMove: React.FC<TeamMoveProps> = ({
  length,
  name,
  onAdjust,
  position
}) => {
  const translate = useTranslate()

  if (position === null) {
    return null
  }

  const { case: standsOn, move } = position

  return (
    <div className='team-move'>
      <p className='team-move-readout'>
        {move > 0 && (
          <span className='walked'>
            {translate('board.walked', { count: move })}
          </span>
        )}
        <span className='stands-on'>
          {translate('board.case', { case: standsOn, length })}
        </span>
      </p>
      {onAdjust !== undefined && (
        <Button
          aria-label={translate('board.back', { team: name })}
          className='team-press'
          isDisabled={standsOn === 0}
          onPress={() => {
            onAdjust(-1)
          }}
          size='small'
          variant='outlined'
        >
          <MinusIcon />
        </Button>
      )}
      {onAdjust !== undefined && (
        <Button
          aria-label={translate('board.forward', { team: name })}
          className='team-press'
          isDisabled={standsOn >= length}
          onPress={() => {
            onAdjust(1)
          }}
          size='small'
          variant='outlined'
        >
          <PlusIcon />
        </Button>
      )}
    </div>
  )
}
