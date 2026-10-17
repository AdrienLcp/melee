import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import {
  buildScoreboard,
  hasAnybodyScored
} from '@melee/core/scoring/scoreboard'

import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './score-track.sass'

/** One seat's own reading in place of its score: the figure printed, and how far along it is, from 0 to 1. */
export type SeatProgress = {
  figure: string
  filled: number
}

type ScoreTrackProps = {
  players: readonly PublicPlayer[]
  /**
   * Prints each seat's progress instead of its score, in seat order rather
   * than ranked — the slate's sheets, which are a count of lines written and
   * not a standing.
   */
  progressOf?: (player: PublicPlayer) => SeatProgress
  /** The seated host's own piece, in a keyline; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/**
 * The standings as one line of pieces along the top of a console held in a
 * hand: the score, the pawn and the name of every seat, ranked. It is what
 * lets the reveal, the slate and the final board keep the game's state on a
 * screen too short for the ruled board.
 */
export const ScoreTrack: React.FC<ScoreTrackProps> = ({
  players,
  progressOf,
  youId
}) => {
  const translate = useTranslate()
  const isRanked = progressOf === undefined && hasAnybodyScored(players)
  const seats = (
    progressOf === undefined
      ? buildScoreboard(players).map(({ player }) => player)
      : players
  ).map((player) => {
    const progress = progressOf?.(player) ?? null

    return {
      figure:
        progress?.figure ??
        (isRanked ? translate('player.score', { points: player.score }) : null),
      player,
      progress
    }
  })
  const longestFigure = Math.max(
    1,
    ...seats.map(({ figure }) => figure?.length ?? 0)
  )

  return (
    <ol
      aria-label={translate('host.standings')}
      className='score-track'
      style={{ '--figure-length': longestFigure }}
    >
      {seats.map(({ figure, player, progress }) => (
        <li
          className={classNames(
            'seat',
            player.id === youId && 'you',
            !player.isConnected && 'away',
            progress !== null && 'in-progress'
          )}
          key={player.id}
          style={
            progress === null ? undefined : { '--filled': progress.filled }
          }
        >
          <span className='reading'>
            <Pawn seat={players.indexOf(player)} />
            {figure !== null && <span className='figure'>{figure}</span>}
          </span>
          <span className='name'>{player.nickname}</span>
          {!player.isConnected && (
            <VisuallyHidden elementType='span'>{` (${translate('player.away')})`}</VisuallyHidden>
          )}
          {player.id === youId && (
            <VisuallyHidden elementType='span'>{` (${translate('player.you')})`}</VisuallyHidden>
          )}
        </li>
      ))}
    </ol>
  )
}
