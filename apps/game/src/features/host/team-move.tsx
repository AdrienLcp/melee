import type React from 'react'

import type { Team } from '@melee/protocol/team'

import { Button } from '@/presentation/components/button'
import { MinusIcon, PlusIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './team-leaflet.sass'
import './team-move.sass'

type TeamMoveProps = {
  /** The track's last case, which the readout counts towards. */
  length: number
  /**
   * Walks the pawn a case either way, through the team's score. Absent on a
   * screen that moves nothing, which reads the move and offers no press.
   */
  onAdjust?: (cases: 1 | -1) => void
  team: Team
}

/**
 * What the round walked a team's pawn and where it stands now, under the
 * team's head: the line the table checks before *Next round*, and the one
 * place the host puts a miscounted case right.
 */
export const TeamMove: React.FC<TeamMoveProps> = ({
  length,
  onAdjust,
  team
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()

  if (team.board === null) {
    return null
  }

  const { case: standsOn, move } = team.board

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
          aria-label={translate('board.back', { team: teamName(team) })}
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
          aria-label={translate('board.forward', { team: teamName(team) })}
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
