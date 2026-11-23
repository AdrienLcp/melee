import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import { buildScoreboard, standsOnPodium } from '@melee/core/scoring/scoreboard'

import { shownPoints } from '@/helpers/shown-points'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './seat-podium.sass'

type SeatPodiumProps = {
  /**
   * The steps are the game's result rather than a line under a winning team:
   * no heading, and drawn large enough to be the first thing the final board
   * says.
   */
  isWinners?: boolean
  players: readonly PublicPlayer[]
  /** The seat this screen holds, stamped the way the scoreboard stamps it. */
  youId: PlayerId | null
}

/**
 * The best three seats, each pawn standing on its step: the final board of a
 * seat-by-seat evening, and on a team evening the seats under the winning
 * team, whose scores kept counting.
 *
 * Ranked as the scoreboard ranks, so a tie shares its step and the next place
 * is skipped; a seat on nought never climbs one. The markup stays in rank
 * order for a reader, and the stylesheet stands the first in the middle.
 */
export const SeatPodium: React.FC<SeatPodiumProps> = ({
  isWinners = false,
  players,
  youId
}) => {
  const translate = useTranslate()
  const placed = buildScoreboard(players).filter(standsOnPodium)

  if (placed.length === 0) {
    return null
  }

  return (
    <section className='seat-podium' data-winners={isWinners || undefined}>
      {!isWinners && (
        <h2 className='title'>{translate('team.final.podium')}</h2>
      )}
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
              {player.board === null
                ? translate('player.score', {
                    points: shownPoints(player.score)
                  })
                : translate('board.at', { case: player.board.case })}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
