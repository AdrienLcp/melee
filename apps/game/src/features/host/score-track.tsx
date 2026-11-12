import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { BoardPosition } from '@melee/protocol/board'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import {
  buildScoreboard,
  hasAnybodyScored
} from '@melee/core/scoring/scoreboard'
import { buildTeamBoard, hasAnyTeamScored } from '@melee/core/team/team-board'

import { shownPoints } from '@/helpers/shown-points'
import { CaseMark } from '@/presentation/components/case-mark'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { Translate } from '@/presentation/i18n/translation'
import { useTeamName } from '@/presentation/i18n/use-team-name'

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
  /**
   * One piece per team in place of the seats when the room plays in teams —
   * the standing the room is racing in. Progress stays per seat: a sheet is
   * one screen's.
   */
  teams?: readonly Team[]
  /**
   * The track's length, passed when the room races on one: each piece draws
   * its case as the track draws it, its finish flagged. Omitted, a piece
   * walking a pawn prints no case.
   */
  trackLength?: number
  /** The seated host's own piece, in a keyline; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

type Standing = {
  board: BoardPosition | null
  score: number
}

/**
 * What a piece prints for where it stands: the case as the track's square on a
 * track, its points otherwise — never both, because two figures ranking the
 * same people would disagree.
 */
const StandingFigure: React.FC<{
  standing: Standing
  trackLength: number | undefined
}> = ({ standing, trackLength }) => {
  const translate = useTranslate()

  if (standing.board !== null) {
    return trackLength === undefined ? null : (
      <CaseMark at={standing.board.case} length={trackLength} />
    )
  }

  return (
    <span className='figure'>
      {translate('player.score', { points: shownPoints(standing.score) })}
    </span>
  )
}

/**
 * How many characters wide the widest reading is, which sizes every piece: a
 * case's square is a character wider than its number.
 */
const longestFigureOf = (
  standings: readonly Standing[],
  translate: Translate
): number =>
  Math.max(
    1,
    ...standings.map(({ board, score }) =>
      board === null
        ? translate('player.score', { points: shownPoints(score) }).length
        : String(board.case).length + 1
    )
  )

/**
 * The standings as one line of pieces along the top of a console held in a
 * hand: the score, the pawn and the name of every seat, ranked. It is what
 * lets the reveal, the slate and the final board keep the game's state on a
 * screen too short for the ruled board.
 */
export const ScoreTrack: React.FC<ScoreTrackProps> = ({
  players,
  progressOf,
  teams = [],
  trackLength,
  youId
}) => {
  const translate = useTranslate()

  if (progressOf === undefined && teams.length > 0) {
    return <TeamTrack teams={teams} trackLength={trackLength} youId={youId} />
  }

  const isRanked = progressOf === undefined && hasAnybodyScored(players)
  const seats = (
    progressOf === undefined
      ? buildScoreboard(players).map(({ player }) => player)
      : players
  ).map((player) => ({ player, progress: progressOf?.(player) ?? null }))
  const longestFigure = isRanked
    ? longestFigureOf(players, translate)
    : Math.max(1, ...seats.map(({ progress }) => progress?.figure.length ?? 0))

  return (
    <ol
      aria-label={translate('host.standings')}
      className='score-track'
      style={{ '--figure-length': longestFigure }}
    >
      {seats.map(({ player, progress }) => (
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
            {progress !== null ? (
              <span className='figure'>{progress.figure}</span>
            ) : (
              isRanked && (
                <StandingFigure standing={player} trackLength={trackLength} />
              )
            )}
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

/** The track with a piece per team: its pawn, its score, its name. */
const TeamTrack: React.FC<{
  teams: readonly Team[]
  trackLength: number | undefined
  youId: PlayerId | null
}> = ({ teams, trackLength, youId }) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const isRanked = hasAnyTeamScored(teams)
  const ranked = buildTeamBoard(teams).map(({ team }) => team)
  const longestFigure = isRanked ? longestFigureOf(teams, translate) : 1

  return (
    <ol
      aria-label={translate('host.standings')}
      className='score-track'
      style={{ '--figure-length': longestFigure }}
    >
      {ranked.map((team) => (
        <li
          className={classNames(
            'seat',
            youId !== null && team.seatIds.includes(youId) && 'you'
          )}
          key={team.id}
        >
          <span className='reading'>
            <Pawn colour={team.colour} />
            {isRanked && (
              <StandingFigure standing={team} trackLength={trackLength} />
            )}
          </span>
          <span className='name'>{teamName(team)}</span>
        </li>
      ))}
    </ol>
  )
}
