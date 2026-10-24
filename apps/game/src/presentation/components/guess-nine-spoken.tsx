import type React from 'react'

import type { GuessNineCell } from '@melee/protocol/guess-nine'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundContent } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import { GuessNineKeeper } from './guess-nine-keeper'
import { GuessNineSheet } from './guess-nine-sheet'
import { GuessNineTurn } from './guess-nine-turn'

import './guess-nine-spoken.sass'

type GuessNineSpokenProps = {
  /** Sends the keeper's tick; `null` on a screen that keeps no list. */
  onTick:
    | ((cell: GuessNineCell | 'blackWord', isTicked: boolean) => boolean)
    | null
  players: readonly PublicPlayer[]
  /** The seat reading it, `null` on a screen with no seat. */
  seatId: PlayerId | null
  spoken: NonNullable<Extract<RoundContent, { kind: 'guessnine' }>['spoken']>
  teams: readonly Team[]
}

/**
 * A spoken round on a seat: the keeper's list on the one screen sent it, and
 * everywhere else whose turn it is over the grid lighting as the keeper ticks
 * — the guessing team told who to say its answers to.
 */
export const GuessNineSpoken: React.FC<GuessNineSpokenProps> = ({
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
      <GuessNineKeeper
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
    <section className='guess-nine-spoken'>
      {isGuessing ? (
        <p className='say'>
          {translate('guessnine.spoken.yourTeam', {
            nickname: keeper?.nickname ?? ''
          })}
        </p>
      ) : (
        <GuessNineTurn
          players={players}
          seatId={seatId}
          spoken={spoken}
          teams={teams}
        />
      )}
      <GuessNineSheet lines={[]} tickedCells={spoken.tickedCells} />
    </section>
  )
}
