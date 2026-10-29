import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { PlayerId, RoomCode } from '@melee/protocol/identifiers'
import type {
  HostRoomView,
  PublicPlayer,
  RoomSettings
} from '@melee/protocol/room'

import { AwayMark } from '@/presentation/components/away-mark'
import { GameIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { RoomInvitation } from '@/presentation/components/room-invitation'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useEntryName } from '@/presentation/i18n/line-up-entry-names'
import { gameNameKey } from '@/presentation/i18n/translation'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './table-lobby.sass'

/**
 * Whether the room's own screen sets its lobby as a table: seats that are
 * dealt into teams or pick one, or seats racing a pawn each round the track.
 * Its setup — the games included — is then the panel's, because the stage is
 * the room's to read.
 */
export const isSetAsTable = ({
  board,
  teams
}: Pick<RoomSettings, 'board' | 'teams'>): boolean =>
  teams.kind === 'drawn' ||
  teams.kind === 'chosen' ||
  (teams.kind === 'off' && board.kind === 'track')

type TableLobbyProps = {
  roomCode: RoomCode
  view: HostRoomView
  /** The seat this console took, in a keyline; `null` on the wall. */
  youId: PlayerId | null
}

/**
 * A table of teams sitting down, on the screen the room reads: the evening's
 * card — what is played, how it is won, the code and the square to join — and
 * under it the seats as they arrive, then the teams they are dealt into. The
 * track runs round it already, every team's pawn on the start.
 *
 * It carries no control: it is the wall's alone.
 */
export const TableLobby: React.FC<TableLobbyProps> = ({
  roomCode,
  view,
  youId
}) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const { players, settings, teams } = view
  const isDrawn = settings.teams.kind === 'drawn'
  const isBySeat = settings.teams.kind === 'off'
  // Before the deal every tray is empty, and the arrivals above say why.
  const isWaitingForDraw =
    isDrawn && !teams.some((team) => team.seatIds.length > 0)
  const unassigned = players.filter(
    (player) => !teams.some((team) => team.seatIds.includes(player.id))
  )

  const seatsOf = (team: (typeof teams)[number]): PublicPlayer[] =>
    players.filter((player) => team.seatIds.includes(player.id))

  return (
    <div
      className='stage table-lobby'
      style={{ '--team-count': Math.max(teams.length, 1) }}
    >
      <TableCard roomCode={roomCode} view={view} />

      {players.length === 0 ? (
        <section className='arrivals'>
          <div className='arrivals-head'>
            <h3>{translate('team.empty')}</h3>
          </div>
        </section>
      ) : (
        unassigned.length > 0 && (
          <section className='arrivals'>
            <div className='arrivals-head'>
              <h3>
                {translate(
                  isBySeat
                    ? 'host.table.arrivals.seats'
                    : isDrawn
                      ? 'host.table.arrivals.drawn'
                      : 'host.table.arrivals.chosen',
                  { count: unassigned.length }
                )}
              </h3>
            </div>
            <SeatChips players={unassigned} roster={players} youId={youId} />
          </section>
        )
      )}

      {!isBySeat && (
        <ol aria-label={translate('team.title')} className='table-teams'>
          {teams.map((team) => {
            const members = seatsOf(team)

            return (
              <li
                className={classNames(
                  'team-block',
                  youId !== null && team.seatIds.includes(youId) && 'yours'
                )}
                data-waiting={isWaitingForDraw || undefined}
                key={team.id}
                style={{ '--team': `var(--pawn-${team.colour})` }}
              >
                <h3 className='team-head'>
                  <Pawn colour={team.colour} />
                  <span className='team-name'>{teamName(team)}</span>
                </h3>
                {members.length > 0 && (
                  <SeatChips players={members} roster={players} youId={youId} />
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

/**
 * What the evening is, on paper: its name, how it is won, the game the next
 * round comes out of the box on, and the way in. The rest of the line-up stays
 * in the box until its own round.
 */
const TableCard: React.FC<{ roomCode: RoomCode; view: HostRoomView }> = ({
  roomCode,
  view
}) => {
  const translate = useTranslate()
  const { board, game, lineUp, roundCount, teams } = view.settings
  const isBySeat = teams.kind === 'off'
  const entryName = useEntryName(view.settings)
  const isEvening = lineUp.length > 1

  const title = isEvening
    ? translate(isBySeat ? 'host.table.eveningSeats' : 'host.table.evening')
    : game === null
      ? translate('player.choosingGame')
      : translate(gameNameKey(game.kind))

  const rules =
    board.kind === 'track' && isBySeat
      ? roundCount === null
        ? translate('host.table.rules.seatTrackOpen', { length: board.length })
        : translate('host.table.rules.seatTrack', {
            length: board.length,
            rounds: roundCount
          })
      : board.kind === 'track'
        ? roundCount === null
          ? translate('host.table.rules.trackOpen', { length: board.length })
          : translate('host.table.rules.track', {
              length: board.length,
              rounds: roundCount
            })
        : roundCount === null
          ? translate('host.table.rules.pointsOpen')
          : translate('host.table.rules.points', { rounds: roundCount })

  return (
    <article className='table-card'>
      <h2 className='table-title'>{title}</h2>
      <p className='table-rules'>{rules}</p>
      {isEvening && game !== null && (
        <p
          className='next-spine'
          style={{
            '--spine': `var(--spine-${game.kind})`,
            '--spine-ink': `var(--on-spine-${game.kind})`
          }}
        >
          <GameIcon game={game.kind} />
          {entryName}
        </p>
      )}
      <RoomInvitation isUnattended roomCode={roomCode} />
    </article>
  )
}

const SeatChips: React.FC<{
  players: readonly PublicPlayer[]
  /** The whole room, whose order is what picks a pawn's colour. */
  roster: readonly PublicPlayer[]
  youId: PlayerId | null
}> = ({ players, roster, youId }) => {
  const translate = useTranslate()

  return (
    <ul className='seat-chips'>
      {players.map((player) => (
        <li
          className={classNames(
            'seat-chip',
            player.id === youId && 'you',
            !player.isConnected && 'away'
          )}
          key={player.id}
        >
          <Pawn seat={roster.indexOf(player)} />
          <span className='name'>{player.nickname}</span>
          {!player.isConnected && <AwayMark />}
          {player.id === youId && (
            <VisuallyHidden elementType='span'>{` (${translate('player.you')})`}</VisuallyHidden>
          )}
        </li>
      ))}
    </ul>
  )
}
