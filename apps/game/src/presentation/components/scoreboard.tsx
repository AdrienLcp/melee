import type React from 'react'
import { useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'

import {
  buildRoster,
  buildScoreboard,
  hasAnybodyScored
} from '@melee/core/scoring/scoreboard'

import { shownPoints } from '@/helpers/shown-points'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'

import { AwayMark } from './away-mark'
import { Button } from './button'
import { CaseMark } from './case-mark'
import { CrossIcon } from './icons'
import { Pawn } from './pawn'
import { ReadyMark } from './ready-mark'
import { VisuallyHidden } from './visually-hidden'

import './scoreboard.sass'

/** Past this a ranking is read as a block rather than one row at a time. */
const PLAYERS_PER_COLUMN = 8

type ScoreboardProps = {
  /** For a caller that lays the rows out differently — the final board does. */
  className?: string
  /**
   * The board is the game's result rather than who is in the room, which is
   * two things at once: it publishes how tall it is, so a stage with a height
   * budget can divide by it, and it deals into two columns past eight players
   * where the box it is drawn in has room for them. A roster does neither — it
   * is read while it is still growing, and nobody reads it downwards.
   *
   * The caller still owes the container the columns are measured against.
   */
  isResult?: boolean
  /**
   * Lists who has sat down rather than how they stand: no rank, case or
   * points, whatever the scores say — and so does a room whose teams walk the
   * track, where a seat has no standing to print. The lobby's roster passes it — its chips
   * are dealt across a third of the roster wide, where a ranking is read
   * downwards and the points' columns left the name no room at all.
   */
  isRoster?: boolean
  /**
   * Names the list where the screen around it does not. The lobby roster on a
   * player's screen is a column of nicknames under a pitch, and a reader who
   * cannot see it is told only "list, six items".
   */
  label?: string
  /**
   * Checks each seat back at the table between two rounds. Off wherever
   * nobody is asked to be ready.
   */
  marksReady?: boolean
  /**
   * Stands each player's pawn beside their name, coloured by their seat — the
   * roster's order as given, before the board ranks it. Off by default, because
   * a board whose type is a height budget divided by its rows was measured
   * without one.
   */
  hasPawns?: boolean
  /**
   * Gives each row a way to drop that player. Omitted everywhere the board is
   * something to *read* — the room's screen mid-round, a player's screen, the
   * final board — and passed only by the host's own roster, which is the one
   * surface where who is in the room is being managed rather than shown.
   */
  onRemove?: (playerId: string) => void
  /** Ranked here, not by the caller — ties share a rank and the order is stable. */
  players: readonly PublicPlayer[]
  /**
   * The order the rows stood in before the scores last moved. A row that
   * changed places travels from its old one; omitted, every row is drawn where
   * it stands. Only for a single column, where a place is one row's height.
   */
  rankedBefore?: readonly PlayerId[] | null
  /**
   * The seats already at the table when the roster was opened; any other row
   * is set down as it joins — the first one too, which takes the place of an
   * empty table. Passed by the host's roster while the table gathers, and
   * omitted once the ranking can move a row: a row put back in the list
   * replays its entrance.
   */
  seatedBefore?: ReadonlySet<PlayerId>
  /** Only ever CSS custom properties a layout needs at runtime. */
  style?: React.CSSProperties
  /**
   * The track's length, passed by a list read up close — the host's panel —
   * to print each case as the track's own tag, its finish flagged. Omitted,
   * a case is the word and a figure a room reads from across it.
   */
  trackLength?: number
  /**
   * Drawn at the end of the reader's own row, after the name gives way: the
   * press that repaints the pawn, on a player's lobby roster.
   */
  youAction?: React.ReactNode
  /**
   * Highlights one row: a player passes their own id, a seated host console its
   * seat, and the wall — nobody's screen — passes none.
   */
  youId?: PlayerId | null
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  className,
  hasPawns,
  isResult,
  isRoster,
  label,
  marksReady,
  onRemove,
  players,
  rankedBefore,
  seatedBefore,
  style,
  trackLength,
  youAction,
  youId
}) => {
  const translate = useTranslate()
  const { onLeft, rows } = useLeavingRows(
    players,
    isRoster === true ? buildRoster : buildScoreboard
  )
  const isRanked = isRoster !== true && hasAnybodyScored(players)
  // A seat walking a pawn prints its case and nothing else: the room plays for
  // the track or for points, never both.
  const isOnTrack = players.some((player) => player.board !== null)

  return (
    <ol
      aria-label={label}
      className={[
        'scoreboard',
        isRanked && 'ranked',
        isResult === true &&
          players.length > PLAYERS_PER_COLUMN &&
          'in-columns',
        onRemove !== undefined && 'removable',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        ...(isResult === true
          ? {
              '--scoreboard-count': players.length,
              '--scoreboard-rows': Math.ceil(players.length / 2)
            }
          : {})
      }}
    >
      {rows.map(({ isLeaving, player, rank, seat }, at) => {
        const placesClimbed = isLeaving
          ? 0
          : placesClimbedBy({ at, player, rankedBefore })

        return (
          <li
            aria-hidden={isLeaving || undefined}
            className={[
              player.isConnected ? 'connected' : 'away',
              player.id === youId && 'you'
            ]
              .filter(Boolean)
              .join(' ')}
            // The rank as ranked, so a board can style a podium without counting
            // rows: two players sharing first are both `1`, and the row after
            // them is `3`. Absent until somebody has scored, the same way the
            // column is.
            data-arrived={
              (seatedBefore !== undefined && !seatedBefore.has(player.id)) ||
              undefined
            }
            data-leaving={isLeaving || undefined}
            data-moved={
              placesClimbed === 0
                ? undefined
                : placesClimbed > 0
                  ? 'up'
                  : 'down'
            }
            data-rank={isRanked ? rank : undefined}
            inert={isLeaving}
            key={player.id}
            onAnimationEnd={
              isLeaving
                ? (event) => {
                    if (event.target === event.currentTarget) {
                      onLeft(player.id)
                    }
                  }
                : undefined
            }
            style={
              placesClimbed === 0
                ? undefined
                : { '--moved-from': `${placesClimbed * 100}%` }
            }
          >
            {isRanked && <span className='rank'>{rank}</span>}
            <span className='nickname'>
              {hasPawns === true && <Pawn seat={seat} />}
              <span className='name'>{player.nickname}</span>
              {marksReady === true && <ReadyMark isReady={player.isReady} />}
              <AwayMark isAway={!player.isConnected} />
              {player.id === youId && (
                <VisuallyHidden elementType='span'>{` (${translate('player.you')})`}</VisuallyHidden>
              )}
              {player.id === youId && youAction !== undefined && (
                <span className='you-action'>{youAction}</span>
              )}
            </span>
            {isRanked && player.board !== null && (
              <span className='case'>
                {trackLength === undefined ? (
                  <RichText
                    parts={translate.rich('board.atColumn', {
                      case: player.board.case,
                      figure: (figure) => (
                        <span className='case-figure'>{figure}</span>
                      )
                    })}
                  />
                ) : (
                  <CaseMark at={player.board.case} length={trackLength} />
                )}
              </span>
            )}
            {isRanked && !isOnTrack && (
              <span className='score'>
                {translate('player.score', {
                  points: shownPoints(player.score)
                })}
              </span>
            )}
            {onRemove !== undefined && (
              <Button
                aria-label={translate('host.players.removeNamed', {
                  nickname: player.nickname
                })}
                className='remove'
                onPress={() => {
                  onRemove(player.id)
                }}
                size='small'
                variant='outlined'
              >
                <CrossIcon />
              </Button>
            )}
          </li>
        )
      })}
    </ol>
  )
}

type Row = { player: PublicPlayer; rank: number }

type DrawnRow = Row & {
  /** Gone from the room, drawn where it stood until its exit ends. */
  isLeaving: boolean
  /** Its place in the roster's order, which colours its pawn. */
  seat: number
}

type LeftRow = DrawnRow & { at: number }

const seatOf = (players: readonly PublicPlayer[], id: PlayerId): number =>
  players.findIndex((seated) => seated.id === id)

/**
 * Keeps a row whose player left drawn where it stood until its exit ends,
 * since the snapshot that ends it no longer holds that player. Pass `players`
 * as the snapshot holds them, so a new list means a new snapshot.
 */
const useLeavingRows = (
  players: readonly PublicPlayer[],
  rowsOf: (players: readonly PublicPlayer[]) => readonly Row[]
): { onLeft: (id: PlayerId) => void; rows: readonly DrawnRow[] } => {
  const [held, setHeld] = useState(players)
  const [left, setLeft] = useState<readonly LeftRow[]>([])

  if (players !== held) {
    const present = new Set(players.map((player) => player.id))
    const leaving = rowsOf(held).flatMap((row, at) =>
      present.has(row.player.id)
        ? []
        : [{ ...row, at, isLeaving: true, seat: seatOf(held, row.player.id) }]
    )

    setLeft((current) => [
      ...current.filter((row) => !present.has(row.player.id)),
      ...leaving
    ])
    setHeld(players)
  }

  const rows: DrawnRow[] = rowsOf(players).map((row) => ({
    ...row,
    isLeaving: false,
    seat: seatOf(players, row.player.id)
  }))

  for (const row of left.toSorted((first, second) => first.at - second.at)) {
    rows.splice(Math.min(row.at, rows.length), 0, row)
  }

  return {
    onLeft: (id) => {
      setLeft((current) => current.filter((row) => row.player.id !== id))
    },
    rows
  }
}

const placesClimbedBy = ({
  at,
  player,
  rankedBefore
}: {
  at: number
  player: PublicPlayer
  rankedBefore: ScoreboardProps['rankedBefore']
}): number => {
  const before = rankedBefore?.indexOf(player.id) ?? -1

  return before === -1 ? 0 : before - at
}
