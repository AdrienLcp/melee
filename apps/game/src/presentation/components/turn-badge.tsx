import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundTurn } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { playsThisTurn } from '@melee/core/team/team-turn'

import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './turn-badge.sass'

type TurnBadgeProps = {
  /** Names the team alone, for a phone's chrome, where the screen below says the rest. */
  isCompact?: boolean
  /** Who a turn that chose its seats is named by. */
  players: readonly PublicPlayer[]
  /** The seat reading it, which is told it is *its* turn; `null` on a screen with no seat. */
  seatId: PlayerId | null
  teams: readonly Team[]
  turn: RoundTurn
}

/**
 * Whose round this is inside a set, printed as that team's tray: its colour
 * banded across the top, its pawn, who plays and how far the set has come. A
 * duel bands both teams' colours and puts a pawn at each end, one per name.
 */
export const TurnBadge: React.FC<TurnBadgeProps> = ({
  isCompact = false,
  players,
  seatId,
  teams,
  turn
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const [teamId, rivalId] = turn.teamIds
  const [chosenId, rivalSeatId] = turn.seatIds ?? []
  const team = teams.find((candidate) => candidate.id === teamId)
  const rival = teams.find((candidate) => candidate.id === rivalId)

  if (team === undefined) {
    return null
  }

  const nameOf = (playerId: PlayerId | undefined) =>
    players.find((player) => player.id === playerId)?.nickname ?? ''

  const isYours = seatId !== null && playsThisTurn({ seatId, teams, turn })

  const plays = () => {
    if (turn.style === 'duel') {
      return translate('team.turn.duel', {
        first: nameOf(chosenId),
        second: nameOf(rivalSeatId)
      })
    }

    if (isYours) {
      return translate(
        turn.style === 'solo' ? 'team.turn.yoursAlone' : 'team.turn.yours'
      )
    }

    if (turn.style === 'solo') {
      return isCompact
        ? nameOf(chosenId)
        : translate('team.turn.seatPlays', { name: nameOf(chosenId) })
    }

    return isCompact
      ? teamName(team)
      : translate('team.turn.plays', { team: teamName(team) })
  }

  return (
    <p
      className='turn-badge'
      data-duel={rival !== undefined || undefined}
      data-yours={isYours || undefined}
      style={{
        '--rival': `var(--pawn-${rival?.colour ?? team.colour})`,
        '--team': `var(--pawn-${team.colour})`
      }}
    >
      <Pawn colour={team.colour} />
      <span className='plays'>{plays()}</span>
      {rival !== undefined && <Pawn colour={rival.colour} />}
      {turn.of > 1 && (
        <span className='of'>
          {translate('team.turn.of', { index: turn.index + 1, of: turn.of })}
        </span>
      )}
    </p>
  )
}
