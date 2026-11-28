import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { MostLikelyCount } from '@melee/protocol/most-likely'
import type { PublicPlayer } from '@melee/protocol/room'

import { roomsChoice } from '@melee/core/mostlikely/tally'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { Pawn } from './pawn'
import { VisuallyHidden } from './visually-hidden'

import './most-likely-tally.sass'

type MostLikelyTallyProps = {
  /**
   * Prints each voter's name beside its pawn: a seat's own screen, read up
   * close, where _who picked me?_ is answered in words. A screen read across
   * the room shows the pawns alone and says the names to assistive tech.
   */
  isVoterNamed?: boolean
  players: readonly PublicPlayer[]
  /** Who voted for each seat, most voted first, as the server counted them. */
  tally: readonly MostLikelyCount[]
  /** The seat this screen voted for, marked on its row; `null` on a screen that cast none. */
  yourBallot: PlayerId | null
}

/**
 * The ballots counted: a row per seat somebody voted for, the pawn of every
 * seat that voted for it under its name, the room's choice on the saffron
 * piece the reflex race gives its taker. At most one pawn a seat across the
 * whole tally, so a full table's ballots are 24 small pawns however they fell.
 */
export const MostLikelyTally: React.FC<MostLikelyTallyProps> = ({
  isVoterNamed = false,
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
        {tally.map(({ playerId, voterIds }) => (
          <li
            data-chosen={chosen.includes(playerId) || undefined}
            data-yours={playerId === yourBallot || undefined}
            key={playerId}
          >
            <Pawn seat={seatOf(playerId)} />
            <span className='nickname'>{nameOf(playerId)}</span>
            <span className='count'>
              {translate('mostlikely.reveal.votes', {
                count: voterIds.length
              })}
            </span>
            {playerId === yourBallot && (
              <span className='your-vote'>
                {translate('mostlikely.reveal.yourVote')}
              </span>
            )}
            <ul
              aria-label={translate('mostlikely.reveal.votedBy')}
              className='voters'
            >
              {voterIds.map((voterId) => (
                <li key={voterId}>
                  <Pawn seat={seatOf(voterId)} />
                  {isVoterNamed ? (
                    <span className='voter'>{nameOf(voterId)}</span>
                  ) : (
                    <VisuallyHidden elementType='span'>
                      {nameOf(voterId)}
                    </VisuallyHidden>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
