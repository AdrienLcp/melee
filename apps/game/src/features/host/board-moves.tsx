import type React from 'react'
import { DialogTrigger } from 'react-aria-components'

import { POINT } from '@melee/protocol/scoring'

import { buildTeamBoard } from '@melee/core/team/team-board'

import { Button } from '@/presentation/components/button'
import { Leaflet } from '@/presentation/components/leaflet'
import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import type { HostActionsProps } from './host-actions'
import { TeamMove } from './team-move'

import './board-moves.sass'

type BoardMovesProps = Pick<HostActionsProps, 'isLive' | 'send' | 'view'>

/**
 * The teams' moves behind one press, for a console too narrow to keep the
 * standings beside the reveal: the only other place a host puts a miscounted
 * case right before *Next round*. Hidden above the split, where every tray
 * carries its own presses.
 */
export const BoardMoves: React.FC<BoardMovesProps> = ({
  isLive,
  send,
  view
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const { board } = view.settings

  if (board.kind !== 'track' || view.teams.length === 0) {
    return null
  }

  const label = translate('board.fix')

  return (
    <DialogTrigger>
      <Button
        className='board-moves-press'
        isDisabled={!isLive}
        variant='underlined'
      >
        {label}
      </Button>
      <Leaflet aria-label={label} className='board-moves' placement='top'>
        <ol className='board-moves-teams'>
          {buildTeamBoard(view.teams).map(({ team }) => (
            <li
              className='board-moves-team'
              key={team.id}
              style={{ '--team': `var(--pawn-${team.colour})` }}
            >
              <p className='board-moves-name'>
                <Pawn colour={team.colour} />
                {teamName(team)}
              </p>
              <TeamMove
                length={board.length}
                onAdjust={(cases) => {
                  send({
                    points: cases * POINT,
                    target: { kind: 'team', teamId: team.id },
                    type: 'host.adjustScore'
                  })
                }}
                team={team}
              />
            </li>
          ))}
        </ol>
      </Leaflet>
    </DialogTrigger>
  )
}
