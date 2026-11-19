import type React from 'react'

import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { lightsContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { usePlaysOnTrack } from '@/presentation/components/board-kind'
import { CrossIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { MOST_LANES_IN_ONE_COLUMN } from './lights-race'
import './lights-race.sass'

type LightsRankingProps = {
  /** Needed to turn the counts' player ids into names and pawns. */
  players: readonly PublicPlayer[]
  round: RoundView
}

/**
 * The race stopped and ranked: the lanes of the window, most hits first, each
 * with its traps under the cross and what the round paid it. Ties share a
 * place, because two seats on the same count did the same thing.
 */
export const LightsRanking: React.FC<LightsRankingProps> = ({
  players,
  round
}) => {
  const translate = useTranslate()
  const isOnTrack = usePlaysOnTrack()
  const content = lightsContent(round)

  if (content === null) {
    return null
  }

  const ranked = content.seats
    .flatMap((count) => {
      const seat = players.findIndex((player) => player.id === count.playerId)
      const player = players[seat]

      return player === undefined ? [] : [{ count, player, seat }]
    })
    .toSorted((left, right) => right.count.hits - left.count.hits)
  const best = Math.max(1, ...ranked.map((row) => row.count.hits))

  const placeOf = (hits: number): number =>
    ranked.findIndex((row) => row.count.hits === hits) + 1

  const paidTo = (playerId: string): number =>
    round.awards.find((award) => award.playerId === playerId)?.points ?? 0

  return (
    <div
      className='lights-race'
      data-ranked=''
      style={{ '--lanes': ranked.length }}
    >
      <ol
        className='lanes'
        data-two-columns={ranked.length > MOST_LANES_IN_ONE_COLUMN || undefined}
      >
        {ranked.map(({ count, player, seat }) => (
          <li
            className='lane'
            key={player.id}
            style={{
              '--hits': count.hits,
              '--share': (count.hits / best).toFixed(3)
            }}
          >
            <span aria-hidden='true' className='place'>
              {placeOf(count.hits)}
            </span>
            <span className='lane-pawn'>
              <Pawn seat={seat} />
            </span>
            <span className='name'>{player.nickname}</span>
            <span className='track'>
              <i aria-hidden='true' className='bar' />
              <b className='count'>{count.hits}</b>
            </span>
            <span className='traps'>
              <CrossIcon aria-hidden='true' />
              <span aria-hidden='true'>{count.traps}</span>
              <VisuallyHidden elementType='span'>
                {translate('lights.traps', { count: count.traps })}
              </VisuallyHidden>
            </span>
            {!isOnTrack && (
              <span className='paid'>
                {translate('round.scored', {
                  points: shownPoints(paidTo(player.id))
                })}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
