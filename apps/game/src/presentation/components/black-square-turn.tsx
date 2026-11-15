import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundContent } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { Pawn } from '@/presentation/components/pawn'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './black-square-turn.sass'

import { typedName } from '@/presentation/components/typed-name'
import { RichText } from '@/presentation/i18n/rich-text'

type BlackSquareTurnProps = {
  /** Who keeps the list is named by. */
  players: readonly PublicPlayer[]
  /** The seat reading it, ringed when its team is the one guessing; `null` on a screen with no seat. */
  seatId: PlayerId | null
  spoken: NonNullable<Extract<RoundContent, { kind: 'blacksquare' }>['spoken']>
  teams: readonly Team[]
}

/**
 * Whose round a spoken black square is, printed as the guessing team's tray in
 * miniature — its band, its pawn, its name — with the keeper's pawn and name
 * beside it, so the room knows who to say the answers to.
 */
export const BlackSquareTurn: React.FC<BlackSquareTurnProps> = ({
  players,
  seatId,
  spoken,
  teams
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const team = teams.find(({ id }) => id === spoken.guessingTeamId)
  const keeper = players.find(({ id }) => id === spoken.keeperId)

  if (team === undefined) {
    return null
  }

  return (
    <p
      className='black-square-turn'
      data-yours={
        (seatId !== null && team.seatIds.includes(seatId)) || undefined
      }
      style={{ '--team': `var(--pawn-${team.colour})` }}
    >
      <Pawn colour={team.colour} />
      <span className='guessing'>
        <RichText
          parts={translate.rich('blacksquare.spoken.guessing', {
            name: typedName,
            team: teamName(team)
          })}
        />
      </span>
      {keeper !== undefined && (
        <span className='keeper'>
          <Pawn seat={players.indexOf(keeper)} />
          <RichText
            parts={translate.rich('blacksquare.spoken.keeper', {
              name: typedName,
              nickname: keeper.nickname
            })}
          />
        </span>
      )}
    </p>
  )
}
