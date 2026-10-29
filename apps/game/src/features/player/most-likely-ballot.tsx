import type React from 'react'
import { useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { mostLikelyContent } from '@/helpers/round-content'
import { SeatTile } from '@/presentation/components/seat-tile'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'

import './most-likely-ballot.sass'

type MostLikelyBallotProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seat voting, marked *You* among the others it may vote for. */
  youId: PlayerId | null
}

/**
 * Every seat the round opened on as a press, the voter's own included, and one
 * press is the vote: a ballot that can move waits to see the others.
 *
 * Mounted under `key={round.id}`, so the vote is about this round alone.
 */
export const MostLikelyBallot: React.FC<MostLikelyBallotProps> = ({
  onAnswer,
  players,
  round,
  youId
}) => {
  const translate = useTranslate()
  const [castFor, setCastFor] = useState<PlayerId | null>(null)
  // The server's record is what survives a reload; the local one covers the
  // round trip, in which a grid left live takes a second press it then refuses.
  const ballot = castFor ?? mostLikelyContent(round)?.yourBallot ?? null
  const hasVoted =
    ballot !== null || round.answers.some((answer) => answer.playerId === youId)
  const seats = players
    .map((player, seat) => ({ player, seat }))
    .filter(
      ({ player }) => round.openedWithPlayerIds?.includes(player.id) ?? true
    )

  return (
    <section
      aria-label={translate('mostlikely.ballot.label')}
      className='answer-form most-likely-ballot'
    >
      <ul>
        {seats.map(({ player, seat }) => (
          <li key={player.id}>
            <SeatTile
              isChosen={ballot === player.id}
              isDisabled={hasVoted}
              mark={
                player.id === youId
                  ? translate('mostlikely.ballot.you')
                  : undefined
              }
              nickname={player.nickname}
              onPress={() => {
                if (onAnswer({ kind: 'seat', playerId: player.id })) {
                  setCastFor(player.id)
                }
              }}
              seat={seat}
            />
          </li>
        ))}
      </ul>
      <p className='status' role='status'>
        {hasVoted ? translate('mostlikely.ballot.sent') : ''}
      </p>
    </section>
  )
}
