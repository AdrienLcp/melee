import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundDuel } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { playsThisRound } from '@melee/core/team/duel'

import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './duel-badge.sass'

type DuelBadgeProps = {
  duel: RoundDuel
  /** Who the two seats are named by. */
  players: readonly PublicPlayer[]
  /** The seat reading it, ringed when it is one of the two; `null` on a screen with no seat. */
  seatId: PlayerId | null
  teams: readonly Team[]
}

/**
 * Who duels this round, printed as two teams' trays in one: both colours
 * banded across the top, a pawn at each end, one per name.
 */
export const DuelBadge: React.FC<DuelBadgeProps> = ({
  duel,
  players,
  seatId,
  teams
}) => {
  const translate = useTranslate()
  const [teamId, rivalId] = duel.teamIds
  const [firstId, secondId] = duel.seatIds
  const team = teams.find((candidate) => candidate.id === teamId)
  const rival = teams.find((candidate) => candidate.id === rivalId)

  if (team === undefined || rival === undefined) {
    return null
  }

  const nameOf = (playerId: PlayerId) =>
    players.find((player) => player.id === playerId)?.nickname ?? ''

  return (
    <p
      className='duel-badge'
      data-yours={
        (seatId !== null && playsThisRound({ duel, seatId })) || undefined
      }
      style={{
        '--rival': `var(--pawn-${rival.colour})`,
        '--team': `var(--pawn-${team.colour})`
      }}
    >
      <Pawn colour={team.colour} />
      <span className='plays'>
        {translate('team.duel.title', {
          first: nameOf(firstId),
          second: nameOf(secondId)
        })}
      </span>
      <Pawn colour={rival.colour} />
    </p>
  )
}
