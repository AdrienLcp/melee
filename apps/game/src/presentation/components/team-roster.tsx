import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useRef } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Team, TeamId } from '@melee/protocol/team'

import {
  buildTeamBoard,
  hasAnyTeamScored,
  isEveryTeamItsOwnSeat
} from '@melee/core/team/team-board'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import { Pawn } from './pawn'
import { useRowsTravel } from './use-rows-travel'
import { VisuallyHidden } from './visually-hidden'

import './team-roster.sass'

type TeamRosterProps = {
  /** Names the list where the screen around it does not. */
  label: string
  /**
   * Ranks the teams by score and prints it — the standings and the final
   * board. A lobby lists them in colour order, which is the order of the draw.
   */
  isRanked?: boolean
  players: readonly PublicPlayer[]
  /**
   * The teams' ids in the order they stood before the reveal moved them, which
   * a ranked tray travels from. Omitted, the trays are drawn where they stand.
   */
  rankedBefore?: readonly TeamId[] | null
  /** The press a seat offers beside its name: the host's *Move*. */
  seatAction?: (player: PublicPlayer) => React.ReactNode
  /** The presses a team offers in its head: the host's *Rename*, a player's *Join*. */
  teamAction?: (team: Team) => React.ReactNode
  /** A line under a team's head, before its seats: where its pawn stands. */
  teamDetail?: (team: Team) => React.ReactNode
  teams: readonly Team[]
  /**
   * Heads a last group of the seats no team holds yet — waiting for the draw,
   * or still choosing. Omitted, those seats are not drawn at all.
   */
  unassignedLabel?: string
  /** The seat this screen holds, in a keyline, and its team marked as yours. */
  youId: PlayerId | null
}

/**
 * The room as teams: one tray per team, banded in its pawn's colour, its name
 * and score in the head and its seats as chips under it. The band carries the
 * colour and the name carries the meaning, so no team is told apart by hue
 * alone. Where every team is one seat named after itself, the seats are not
 * drawn: each would only say its team's name a second time.
 */
export const TeamRoster: React.FC<TeamRosterProps> = ({
  isRanked = false,
  label,
  players,
  rankedBefore,
  seatAction,
  teamAction,
  teamDetail,
  teams,
  unassignedLabel,
  youId
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const showsRank = isRanked && hasAnyTeamScored(teams)
  // A room with no seat at all is a table answering aloud: there is nobody to
  // list under a team, and nobody to wait for.
  const showsSeats =
    players.length > 0 && !isEveryTeamItsOwnSeat({ players, teams })
  const entries = isRanked
    ? buildTeamBoard(teams)
    : teams.map((team) => ({ rank: null, team }))
  const list = useRef<HTMLOListElement>(null)

  useRowsTravel({
    from: rankedBefore,
    list,
    order: entries.map(({ team }) => team.id).join(' '),
    pace: 'reveal'
  })

  const unassigned = players.filter(
    (player) => !teams.some((team) => team.seatIds.includes(player.id))
  )

  const seatsOf = (seatIds: readonly PlayerId[]): PublicPlayer[] =>
    seatIds.flatMap((seatId) => {
      const player = players.find((candidate) => candidate.id === seatId)

      return player === undefined ? [] : [player]
    })

  return (
    <ol aria-label={label} className='team-roster' ref={list}>
      {entries.map(({ rank, team }) => {
        const members = seatsOf(team.seatIds)
        const isYours = youId !== null && team.seatIds.includes(youId)

        return (
          <li
            className={classNames('team', isYours && 'yours')}
            data-key={team.id}
            data-rank={showsRank ? (rank ?? undefined) : undefined}
            key={team.id}
            style={{ '--team': `var(--pawn-${team.colour})` }}
          >
            <div className='team-head'>
              {showsRank && rank !== null && (
                <span className='rank'>{rank}</span>
              )}
              <Pawn colour={team.colour} />
              <h3 className='team-name'>
                {teamName(team)}
                {isYours && (
                  <VisuallyHidden elementType='span'>{` (${translate('team.yours')})`}</VisuallyHidden>
                )}
              </h3>
              {showsRank && (
                <span className='score'>
                  {translate('player.score', { points: team.score })}
                </span>
              )}
              {teamAction?.(team)}
            </div>
            {teamDetail?.(team)}
            {!showsSeats ? null : members.length === 0 ? (
              <p className='empty'>{translate('team.empty')}</p>
            ) : (
              <SeatChips
                players={members}
                roster={players}
                seatAction={seatAction}
                youId={youId}
              />
            )}
          </li>
        )
      })}

      {unassignedLabel !== undefined && unassigned.length > 0 && (
        <li className='team unassigned'>
          <div className='team-head'>
            <h3 className='team-name'>{unassignedLabel}</h3>
          </div>
          <SeatChips
            players={unassigned}
            roster={players}
            seatAction={seatAction}
            youId={youId}
          />
        </li>
      )}
    </ol>
  )
}

type SeatChipsProps = {
  players: readonly PublicPlayer[]
  /** The whole room, whose order is what picks a pawn's seat. */
  roster: readonly PublicPlayer[]
  seatAction?: (player: PublicPlayer) => React.ReactNode
  youId: PlayerId | null
}

const SeatChips: React.FC<SeatChipsProps> = ({
  players,
  roster,
  seatAction,
  youId
}) => {
  const translate = useTranslate()

  return (
    <ul className='members'>
      {players.map((player) => (
        <li
          className={classNames(
            'member',
            player.id === youId && 'you',
            !player.isConnected && 'away'
          )}
          key={player.id}
        >
          <Pawn seat={roster.indexOf(player)} />
          <span className='name'>{player.nickname}</span>
          {!player.isConnected && (
            <span className='state'>{translate('player.away')}</span>
          )}
          {player.id === youId && (
            <VisuallyHidden elementType='span'>{` (${translate('player.you')})`}</VisuallyHidden>
          )}
          {seatAction?.(player)}
        </li>
      ))}
    </ul>
  )
}
