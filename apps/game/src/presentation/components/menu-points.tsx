import type React from 'react'

import type { ScoreTarget } from '@melee/protocol/client-message'
import { POINT } from '@melee/protocol/scoring'

import { useConnection } from '@/presentation/connection/connection-provider'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { Button } from './button'
import { Disclosure } from './disclosure'
import { MinusIcon, PlusIcon } from './icons'
import { Pawn, pawnNumberOf } from './pawn'

import './menu-points.sass'

type PointsRow = {
  /** The pawn beside the name, `null` for a seat with no pawn on a track. */
  colour: number | null
  /** Whether a point less would change anything: the server floors at nought. */
  canTake: boolean
  /** Whether a point more would: a pawn on the finish has nowhere to go. */
  canGive: boolean
  id: string
  name: string
  standing: string
  target: ScoreTarget
}

/**
 * Points by hand, in every phase: a bonus nobody planned, a challenge played at
 * the table, a call to put right. The teams when there are any, since a seat's
 * adjustment never reaches its team; the seats otherwise.
 *
 * The rows keep the roster's order rather than the standings': a list that
 * re-ranks under the thumb after every press sends the next one to someone
 * else.
 */
export const MenuPoints: React.FC = () => {
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
          colour: team.colour,
          id: team.id,
          name: teamName(team),
          standing:
            pawnCase === null
              ? translate('player.score', { points: team.score })
              : translate('board.case', {
                  case: pawnCase,
                  length: trackLength ?? 0
                }),
          target: { kind: 'team', teamId: team.id }
        }
      })
    : scoredPlayers.map((player, seat) => {
        const pawnCase =
          trackLength === null || player.board === null
            ? null
            : player.board.case

        return {
          canGive: pawnCase === null || pawnCase < (trackLength ?? 0),
          canTake: pawnCase === null ? player.score > 0 : pawnCase > 0,
          colour: pawnCase === null ? null : pawnNumberOf(seat),
          id: player.id,
          name: player.nickname,
          standing:
            pawnCase === null
              ? translate('player.score', { points: player.score })
              : translate('board.case', {
                  case: pawnCase,
                  length: trackLength ?? 0
                }),
          target: { kind: 'seat', playerId: player.id }
        }
      })

  return (
    <Disclosure
      className='menu-points'
      label={translate('menu.points.label')}
      summary={
        isByTeam
          ? translate('menu.points.teams', { count: scoredTeams.length })
          : translate('player.roomSize', { count: scoredPlayers.length })
      }
    >
      <ul className='menu-points-rows'>
        {rows.map((row) => (
          <li
            className='menu-points-row'
            key={row.id}
            style={
              row.colour === null
                ? undefined
                : { '--team': `var(--pawn-${row.colour})` }
            }
          >
            <p className='menu-points-who'>
              <span className='menu-points-name'>
                {row.colour !== null && <Pawn colour={row.colour} />}
                {row.name}
              </span>
              <span className='menu-points-standing'>{row.standing}</span>
            </p>
            <Button
              aria-label={translate('menu.points.take', { name: row.name })}
              className='menu-points-press'
              isDisabled={!isLive || !row.canTake}
              onPress={() => {
                adjustScore(row.target, -POINT)
              }}
              size='small'
              variant='outlined'
            >
              <MinusIcon />
            </Button>
            <Button
              aria-label={translate('menu.points.give', { name: row.name })}
              className='menu-points-press'
              isDisabled={!isLive || !row.canGive}
              onPress={() => {
                adjustScore(row.target, POINT)
              }}
              size='small'
              variant='outlined'
            >
              <PlusIcon />
            </Button>
          </li>
        ))}
      </ul>
    </Disclosure>
  )
}
