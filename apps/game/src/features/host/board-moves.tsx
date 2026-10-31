import type React from 'react'
import { DialogTrigger } from 'react-aria-components'

import { POINT } from '@melee/protocol/scoring'

import {
  rankTrackPawns,
  scoreTargetOf,
  trackPawnsOf
} from '@melee/core/board/track-pawns'

import { Button } from '@/presentation/components/button'
import { Leaflet } from '@/presentation/components/leaflet'
import { TeamMove } from '@/presentation/components/team-move'
import {
  TrackPawnPiece,
  trackPawnNumberOf,
  useTrackPawnName
} from '@/presentation/components/track-pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { HostActionsProps } from './host-actions'

import './board-moves.sass'

type BoardMovesProps = Pick<HostActionsProps, 'isLive' | 'send' | 'view'>

/**
 * The pawns' moves behind one press — the teams', or every seat's — for a console too narrow to keep the
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
  const pawnName = useTrackPawnName()
  const { board } = view.settings
  const pawns = rankTrackPawns(trackPawnsOf(view))

  if (board.kind !== 'track' || pawns.length === 0) {
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
          {pawns.map((pawn) => (
            <li
              className='board-moves-team'
              key={pawn.id}
              style={{ '--team': `var(--pawn-${trackPawnNumberOf(pawn)})` }}
            >
              <p className='board-moves-name'>
                <TrackPawnPiece pawn={pawn} />
                {pawnName(pawn)}
              </p>
              <TeamMove
                length={board.length}
                name={pawnName(pawn)}
                onAdjust={(cases) => {
                  send({
                    points: cases * POINT,
                    target: scoreTargetOf(pawn),
                    type: 'host.adjustScore'
                  })
                }}
                position={pawn.board}
              />
            </li>
          ))}
        </ol>
      </Leaflet>
    </DialogTrigger>
  )
}
