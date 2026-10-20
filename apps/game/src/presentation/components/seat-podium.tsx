import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import { buildScoreboard } from '@melee/core/scoring/scoreboard'

import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './seat-podium.sass'

const PODIUM_PLACES = 3

type SeatPodiumProps = {
  players: readonly PublicPlayer[]
  /** The seat this screen holds, stamped the way the scoreboard stamps it. */
  youId: PlayerId | null
}

/**
 * The best three seats of a team evening, each pawn standing on its step. A
 * team wins the evening, but the seat scores kept counting under it, and this
 * is where they are owed.
 *
 * Ranked as the scoreboard ranks, so a tie shares its step and the next place
 * is skipped; a seat on nought never climbs one. The markup stays in rank
 * order for a reader, and the stylesheet stands the first in the middle.
 */
export const SeatPodium: React.FC<SeatPodiumProps> = ({ players, youId }) => {
  const translate = useTranslate()
  const placed = buildScoreboard(players).filter(
    (entry) => entry.rank <= PODIUM_PLACES && entry.player.score > 0
  )

  if (placed.length === 0) {
    return null
  }

  return (
    <section className='seat-podium'>
      <h2 className='title'>{translate('team.final.podium')}</h2>
      <ol>
        {placed.map(({ player, rank }) => (
          <li
            className={player.id === youId ? 'you' : undefined}
            data-rank={rank}
            key={player.id}
          >
            <span className='stand'>
              <Pawn seat={players.indexOf(player)} />
              <span className='step'>
                {translate('player.final.rank', { rank })}
              </span>
            </span>
            <span className='name'>
              {player.nickname}
              {player.id === youId && (
                <VisuallyHidden elementType='span'>{` (${translate('player.you')})`}</VisuallyHidden>
              )}
            </span>
            <span className='score'>
              {translate('player.score', { points: player.score })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
