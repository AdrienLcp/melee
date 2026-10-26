import type React from 'react'

import type { PlayerId, RoomCode } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundDuel } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { teamOfSeat } from '@melee/core/team/team-board'

import { DuelBadge } from '@/presentation/components/duel-badge'
import { Pawn } from '@/presentation/components/pawn'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './round-chrome.sass'

const MOST_PIPS = 15

type RoundChromeProps = {
  /**
   * The way in for somebody new, at the end of the line: a seated host's
   * console offers it here because its four tiles leave no other room. Absent
   * on a player's screen, which has the menu's invitation.
   */
  /** The two seats this round is a duel between, which take the pips' place. */
  duel?: RoundDuel | null
  invitation?: React.ReactNode
  /**
   * A passing line at the start of the header, which takes the place of the
   * round and the score for as long as it is shown rather than a row of its
   * own: the seated host's arrival notice.
   */
  notice?: React.ReactNode
  players: readonly PublicPlayer[]
  /**
   * Printed where the round would be while no round is being played — the
   * lobby and the final board — so the line still says which table this is.
   */
  roomCode?: RoomCode
  /** `null` when the room plays until its host ends it, which draws no pips. */
  roundCount: number | null
  /**
   * `null` outside a game's rounds: the line then carries the room's code and
   * the seat's name rather than a round and a score nobody has earned yet.
   */
  roundIndex: number | null
  /** The room's teams, so the line names the seat's own once it has one. */
  teams: readonly Team[]
  /** The seat whose pawn the line carries, and whose score — its team's, once it has one. */
  youId: PlayerId
}

/**
 * The seat's own pawn and score, then the round, on the one line the menu
 * trigger ends — the whole of the chrome a screen of four tiles can afford, and
 * the same line on every other screen a seat sees, so it never moves between
 * phases. The pips are the round as squares on a track, dropped when the line
 * is too narrow to hold them.
 */
export const RoundChrome: React.FC<RoundChromeProps> = ({
  invitation,
  notice,
  players,
  roomCode,
  roundCount,
  roundIndex,
  teams,
  duel = null,
  youId
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const yourTeam = teamOfSeat({ playerId: youId, teams })
  const youSeat = players.findIndex((player) => player.id === youId)
  const you = players[youSeat]
  const score = yourTeam?.score ?? you?.score ?? 0

  return (
    <header className='round-chrome'>
      {notice}
      <p className='you'>
        <Pawn seat={Math.max(0, youSeat)} />
        {/* The pawn is already the team's colour; the word is what says it
            to a reader who cannot tell two pawns apart. */}
        {yourTeam !== null && (
          <span className='team'>
            <VisuallyHidden elementType='span'>
              {`${translate('team.yours')} `}
            </VisuallyHidden>
            {teamName(yourTeam)}
          </span>
        )}
        {roundIndex === null ? (
          <span className='name'>
            {you?.nickname ?? translate('player.you')}
          </span>
        ) : (
          <>
            <span className='score'>
              {translate('player.score', { points: score })}
            </span>
            <VisuallyHidden elementType='span'>
              {translate('player.points', { points: score })}
            </VisuallyHidden>
          </>
        )}
      </p>
      {duel !== null && roundIndex !== null && (
        <DuelBadge duel={duel} players={players} seatId={youId} teams={teams} />
      )}
      {roundIndex === null ? (
        roomCode !== undefined && (
          <p className='room'>{translate('player.room', { code: roomCode })}</p>
        )
      ) : (
        <p className='round-index'>
          <VisuallyHidden elementType='span'>
            {roundCount === null
              ? translate('round.indexOpen', { index: roundIndex })
              : translate('round.index', {
                  index: roundIndex,
                  total: roundCount
                })}
          </VisuallyHidden>
          <span aria-hidden='true' className='label'>
            {translate('round.label')}
          </span>
          <span aria-hidden='true' className='figures'>
            {roundCount === null ? roundIndex : `${roundIndex}/${roundCount}`}
          </span>
          {roundCount !== null && roundCount <= MOST_PIPS && duel === null && (
            <span aria-hidden='true' className='pips'>
              {Array.from({ length: roundCount }, (_, pip) => pip + 1).map(
                (pipRound) => (
                  <i
                    data-state={
                      pipRound < roundIndex
                        ? 'done'
                        : pipRound === roundIndex
                          ? 'now'
                          : 'next'
                    }
                    key={pipRound}
                  />
                )
              )}
            </span>
          )}
        </p>
      )}
      {invitation}
    </header>
  )
}
