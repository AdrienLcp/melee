import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { MostLikelyCount } from '@melee/protocol/most-likely'
import type { PublicPlayer } from '@melee/protocol/room'

import { roomsChoice } from '@melee/core/mostlikely/tally'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Pawn } from './pawn'

import './most-likely-tally.sass'

type MostLikelyTallyProps = {
  players: readonly PublicPlayer[]
  /** How many ballots each seat drew, most first, as the server counted them. */
  tally: readonly MostLikelyCount[]
  /** The seat this screen voted for, marked on its row; `null` on a screen that cast none. */
  yourBallot: PlayerId | null
}

/**
 * The ballots counted: a row per seat somebody voted for, a pip per vote, the
 * room's choice on the saffron piece the reflex race gives its taker. Counts
 * only — who voted for whom is never sent, so it cannot be drawn.
 */
export const MostLikelyTally: React.FC<MostLikelyTallyProps> = ({
  players,
  tally,
  yourBallot
}) => {
  const translate = useTranslate()
  const chosen = roomsChoice(tally)

  const seatOf = (playerId: string): number =>
    players.findIndex((player) => player.id === playerId)

  const nameOf = (playerId: string): string =>
    players[seatOf(playerId)]?.nickname ?? '—'

  return (
    <section className='most-likely-tally'>
      <p className='verdict'>
        {translate(
          chosen.length > 0
            ? 'mostlikely.reveal.chose'
            : 'mostlikely.reveal.nobody'
        )}
      </p>
      <ol>
        {tally.map(({ playerId, votes }) => (
          <li
            data-chosen={chosen.includes(playerId) || undefined}
            data-yours={playerId === yourBallot || undefined}
            key={playerId}
          >
            <Pawn seat={seatOf(playerId)} />
            <span className='nickname'>{nameOf(playerId)}</span>
            <span
              aria-hidden='true'
              className='pips'
              style={{ '--votes': votes }}
            />
            <span className='count'>
              {translate('mostlikely.reveal.votes', { count: votes })}
            </span>
            {playerId === yourBallot && (
              <span className='your-vote'>
                {translate('mostlikely.reveal.yourVote')}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
