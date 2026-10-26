import type React from 'react'

import type {
  BlackSquareAnswerCount,
  BlackSquareCell
} from '@melee/protocol/black-square'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundContent } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import { BlackSquareKeeper } from './black-square-keeper'
import { BlackSquareSheet } from './black-square-sheet'
import { BlackSquareTurn } from './black-square-turn'

import './black-square-spoken.sass'

type BlackSquareSpokenProps = {
  /** How many answers the round dealt, three to nine. */
  answerCount: BlackSquareAnswerCount
  /** Sends the keeper's tick; `null` on a screen that keeps no list. */
  onTick:
    | ((cell: BlackSquareCell | 'blackWord', isTicked: boolean) => boolean)
    | null
  players: readonly PublicPlayer[]
  /** The seat reading it, `null` on a screen with no seat. */
  seatId: PlayerId | null
  spoken: NonNullable<Extract<RoundContent, { kind: 'blacksquare' }>['spoken']>
  teams: readonly Team[]
}

/**
 * A spoken round on a seat: the keeper's list on the one screen sent it, and
 * everywhere else whose turn it is over the grid lighting as the keeper ticks
 * — the guessing team told who to say its answers to.
 */
export const BlackSquareSpoken: React.FC<BlackSquareSpokenProps> = ({
  answerCount,
  onTick,
  players,
  seatId,
  spoken,
  teams
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const guessing = teams.find(({ id }) => id === spoken.guessingTeamId)
  const keeper = players.find(({ id }) => id === spoken.keeperId)

  if (spoken.list !== null && onTick !== null && guessing !== undefined) {
    return (
      <BlackSquareKeeper
        guessingTeam={teamName(guessing)}
        list={spoken.list}
        onTick={onTick}
        tickedCells={spoken.tickedCells}
      />
    )
  }

  const isGuessing =
    seatId !== null && (guessing?.seatIds.includes(seatId) ?? false)

  return (
    <section className='black-square-spoken'>
      {isGuessing ? (
        <p className='say'>
          {translate('blacksquare.spoken.yourTeam', {
            nickname: keeper?.nickname ?? ''
          })}
        </p>
      ) : (
        <BlackSquareTurn
          players={players}
          seatId={seatId}
          spoken={spoken}
          teams={teams}
        />
      )}
      <BlackSquareSheet
        cellCount={answerCount}
        lines={[]}
        tickedCells={spoken.tickedCells}
      />
    </section>
  )
}
