import type React from 'react'

import type { ScoreTarget } from '@melee/protocol/client-message'
import { SCORE_ADJUSTMENT_STEP } from '@melee/protocol/scoring'
import type { PawnPiece } from '@melee/protocol/team'

import { TEAM_PAWN_HEAD } from '@melee/core/board/pawn-piece'

import { useConnection } from '@/presentation/connection/connection-provider'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Button } from './button'
import { MinusIcon, PlusIcon } from './icons'
import { Pawn } from './pawn'

import './points-rows.sass'
import { shownPoints } from '@/helpers/shown-points'

/** One seat's or one team's line of points by hand. */
export type PointsRow = {
  /** The pawn beside the name, `null` for a seat with no pawn on a track. */
  piece: PawnPiece | null
  /** Whether a point less would change anything: the server floors at nought. */
  canTake: boolean
  /** Whether a point more would: a pawn on the finish has nowhere to go. */
  canGive: boolean
  id: string
  name: string
  /** The case its pawn stands on, `null` off a board. */
  pawnCase: number | null
  standing: string
  target: ScoreTarget
}

/**
 * The rows `PointsRows` draws, for a caller that lays them out its own way —
 * the podium's roster puts each seat's presses on the seat's own line. `null`
 * where there is nothing to adjust: no room actions, or nobody seated.
 */
export const usePointsRows = (): {
  isLive: boolean
  onAdjust: (target: ScoreTarget, points: number) => void
  rows: PointsRow[]
} | null => {
  const { adjustScore, scoredPlayers, scoredTeams, trackLength } =
    useRoomActions()
  const connection = useConnection()
  const translate = useTranslate()
  const teamName = useTeamName()

  if (adjustScore === null || scoredPlayers.length === 0) {
    return null
  }

  const isLive = connection?.status === 'open'
  const isByTeam = scoredTeams.length > 0

  const rows: PointsRow[] = isByTeam
    ? scoredTeams.map((team) => {
        const pawnCase =
          trackLength === null || team.board === null ? null : team.board.case

        return {
          canGive: pawnCase === null || pawnCase < (trackLength ?? 0),
          canTake: pawnCase === null ? team.score > 0 : pawnCase > 0,
          id: team.id,
          name: teamName(team),
          pawnCase,
          piece: { colour: team.colour, head: TEAM_PAWN_HEAD },
          standing:
            pawnCase === null
              ? translate('player.score', { points: shownPoints(team.score) })
              : translate('board.case', {
                  case: pawnCase,
                  length: trackLength ?? 0
                }),
          target: { kind: 'team', teamId: team.id }
        }
      })
    : scoredPlayers.map((player) => {
        const pawnCase =
          trackLength === null || player.board === null
            ? null
            : player.board.case

        return {
          canGive: pawnCase === null || pawnCase < (trackLength ?? 0),
          canTake: pawnCase === null ? player.score > 0 : pawnCase > 0,
          id: player.id,
          name: player.nickname,
          pawnCase,
          piece:
            pawnCase === null
              ? null
              : { colour: player.colour, head: player.head },
          standing:
            pawnCase === null
              ? translate('player.score', { points: shownPoints(player.score) })
              : translate('board.case', {
                  case: pawnCase,
                  length: trackLength ?? 0
                }),
          target: { kind: 'seat', playerId: player.id }
        }
      })

  return { isLive, onAdjust: adjustScore, rows }
}

/**
 * Points by hand, in every phase: a bonus nobody planned, a challenge played at
 * the table, a call to put right. The teams when there are any, since a seat's
 * adjustment never reaches its team; the seats otherwise. Drawn in the menu and
 * in the console's players tab, which call for it on the same room actions.
 *
 * The rows keep the roster's order rather than the standings': a list that
 * re-ranks under the thumb after every press sends the next one to someone
 * else.
 */
export const PointsRows: React.FC = () => {
  const translate = useTranslate()
  const points = usePointsRows()

  if (points === null) {
    return null
  }

  const { isLive, onAdjust, rows } = points

  return (
    <ul className='points-rows'>
      {rows.map((row) => (
        <li
          className='points-row'
          key={row.id}
          style={
            row.piece === null
              ? undefined
              : { '--team': `var(--pawn-${row.piece.colour})` }
          }
        >
          <p className='points-who'>
            <span className='points-name'>
              {row.piece !== null && (
                <Pawn colour={row.piece.colour} head={row.piece.head} />
              )}
              {row.name}
            </span>
            <span className='points-standing'>{row.standing}</span>
          </p>
          <Button
            aria-label={translate('host.points.take', {
              name: row.name,
              points: shownPoints(SCORE_ADJUSTMENT_STEP)
            })}
            className='points-press'
            isDisabled={!isLive || !row.canTake}
            onPress={() => {
              onAdjust(row.target, -SCORE_ADJUSTMENT_STEP)
            }}
            size='small'
            variant='outlined'
          >
            <MinusIcon />
          </Button>
          <Button
            aria-label={translate('host.points.give', {
              name: row.name,
              points: shownPoints(SCORE_ADJUSTMENT_STEP)
            })}
            className='points-press'
            isDisabled={!isLive || !row.canGive}
            onPress={() => {
              onAdjust(row.target, SCORE_ADJUSTMENT_STEP)
            }}
            size='small'
            variant='outlined'
          >
            <PlusIcon />
          </Button>
        </li>
      ))}
    </ul>
  )
}
