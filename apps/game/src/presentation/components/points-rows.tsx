import type React from 'react'

import type { BoardPosition } from '@melee/protocol/board'
import type { ScoreChange, ScoreTarget } from '@melee/protocol/client-message'
import { SCORE_ADJUSTMENT_STEP } from '@melee/protocol/scoring'
import type { PawnPiece } from '@melee/protocol/team'

import { TEAM_PAWN_HEAD } from '@melee/core/board/pawn-piece'

import { shownPoints } from '@/helpers/shown-points'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Button } from './button'
import { MinusIcon, PlusIcon } from './icons'
import { Pawn } from './pawn'

import './points-rows.sass'

/** One seat's or one team's line of points — or of cases, on a track — by hand. */
export type PointsRow = {
  /** The pawn beside the name, `null` for a seat on a room playing for points. */
  piece: PawnPiece | null
  /** Whether a press less would change anything: the server floors at nought and at the start. */
  canTake: boolean
  /** Whether a press more would: a pawn on the finish has nowhere to go. */
  canGive: boolean
  /** The `+` press's accessible name. */
  giveLabel: string
  id: string
  name: string
  /** The case its pawn stands on, `null` on a room playing for points. */
  pawnCase: number | null
  standing: string
  /** The `−` press's accessible name. */
  takeLabel: string
  target: ScoreTarget
}

type Standing = { board: BoardPosition | null; score: number }

/** What one press moves: a tenth of a round on points, one case on a track. */
const stepOf = ({
  direction,
  isOnTrack
}: {
  direction: 1 | -1
  isOnTrack: boolean
}): ScoreChange =>
  isOnTrack
    ? { cases: direction, kind: 'cases' }
    : { kind: 'points', points: direction * SCORE_ADJUSTMENT_STEP }

/**
 * The rows `PointsRows` draws, for a caller that lays them out its own way —
 * the podium's roster puts each seat's presses on the seat's own line. `null`
 * where there is nothing to adjust: no room actions, or nobody seated.
 */
export const usePointsRows = (): {
  isLive: boolean
  onStep: (row: PointsRow, direction: 1 | -1) => void
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
  const isOnTrack = trackLength !== null

  const rowOf = ({
    id,
    name,
    piece,
    standing: { board, score },
    target
  }: {
    id: string
    name: string
    piece: PawnPiece
    standing: Standing
    target: ScoreTarget
  }): PointsRow => {
    if (trackLength === null) {
      const step = shownPoints(SCORE_ADJUSTMENT_STEP)

      return {
        canGive: true,
        canTake: score > 0,
        giveLabel: translate('host.points.give', { name, points: step }),
        id,
        name,
        pawnCase: null,
        piece: target.kind === 'team' ? piece : null,
        standing: translate('player.score', { points: shownPoints(score) }),
        takeLabel: translate('host.points.take', { name, points: step }),
        target
      }
    }

    const pawnCase = board?.case ?? 0

    return {
      canGive: pawnCase < trackLength,
      canTake: pawnCase > 0,
      giveLabel: translate('board.forward', { team: name }),
      id,
      name,
      pawnCase,
      piece,
      standing: translate('board.case', {
        case: pawnCase,
        length: trackLength
      }),
      takeLabel: translate('board.back', { team: name }),
      target
    }
  }

  const rows: PointsRow[] =
    scoredTeams.length > 0
      ? scoredTeams.map((team) =>
          rowOf({
            id: team.id,
            name: teamName(team),
            piece: { colour: team.colour, head: TEAM_PAWN_HEAD },
            standing: team,
            target: { kind: 'team', teamId: team.id }
          })
        )
      : scoredPlayers.map((player) =>
          rowOf({
            id: player.id,
            name: player.nickname,
            piece: { colour: player.colour, head: player.head },
            standing: player,
            target: { kind: 'seat', playerId: player.id }
          })
        )

  return {
    isLive,
    onStep: (row, direction) => {
      adjustScore(row.target, stepOf({ direction, isOnTrack }))
    },
    rows
  }
}

/**
 * Points by hand, in every phase — cases on a track, where no point is
 * printed: a bonus nobody planned, a challenge played at the table, a call to
 * put right. The teams when there are any, since a seat's
 * adjustment never reaches its team; the seats otherwise. Drawn in the menu and
 * in the console's players tab, which call for it on the same room actions.
 *
 * The rows keep the roster's order rather than the standings': a list that
 * re-ranks under the thumb after every press sends the next one to someone
 * else.
 */
export const PointsRows: React.FC = () => {
  const points = usePointsRows()

  if (points === null) {
    return null
  }

  const { isLive, onStep, rows } = points

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
            aria-label={row.takeLabel}
            className='points-press'
            isDisabled={!isLive || !row.canTake}
            onPress={() => {
              onStep(row, -1)
            }}
            size='small'
            variant='outlined'
          >
            <MinusIcon />
          </Button>
          <Button
            aria-label={row.giveLabel}
            className='points-press'
            isDisabled={!isLive || !row.canGive}
            onPress={() => {
              onStep(row, 1)
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
