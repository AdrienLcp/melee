import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { RoundTurn } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { playsThisTurn } from '@melee/core/team/team-turn'

import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './turn-badge.sass'

type TurnBadgeProps = {
  /** Names the team alone, for a phone's chrome, where the screen below says the rest. */
  isCompact?: boolean
  /** The seat reading it, which is told it is *its* team's turn; `null` on a screen with no seat. */
  seatId: PlayerId | null
  teams: readonly Team[]
  turn: RoundTurn
}

/**
 * Whose round this is inside a set, printed as that team's tray: its colour
 * banded across the top, its pawn, its name and how far the set has come.
 */
export const TurnBadge: React.FC<TurnBadgeProps> = ({
  isCompact = false,
  seatId,
  teams,
  turn
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const team = teams.find((candidate) => candidate.id === turn.teamId)

  if (team === undefined) {
    return null
  }

  const isYours = seatId !== null && playsThisTurn({ seatId, teams, turn })

  return (
    <p
      className='turn-badge'
      data-yours={isYours || undefined}
      style={{ '--team': `var(--pawn-${team.colour})` }}
    >
      <Pawn colour={team.colour} />
      <span className='plays'>
        {isYours
          ? translate('team.turn.yours')
          : isCompact
            ? teamName(team)
            : translate('team.turn.plays', { team: teamName(team) })}
      </span>
      <span className='of'>
        {translate('team.turn.of', { index: turn.index + 1, of: turn.of })}
      </span>
    </p>
  )
}
