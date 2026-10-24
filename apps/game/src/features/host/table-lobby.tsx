import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { PlayerId, RoomCode } from '@melee/protocol/identifiers'
import type {
  HostRoomView,
  PublicPlayer,
  RoomSettings
} from '@melee/protocol/room'

import { GameIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { RoomInvitation } from '@/presentation/components/room-invitation'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryNames } from '@/presentation/i18n/line-up-entry-names'
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

/** The empty seats an empty table shows, enough to read as a table without crowding it. */
const SEATS_AT_AN_EMPTY_TABLE = 4

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
          <EmptySeats
            count={SEATS_AT_AN_EMPTY_TABLE}
            label={translate('host.table.nobody.seat')}
          />
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
                {members.length > 0 ? (
                  <SeatChips players={members} roster={players} youId={youId} />
                ) : (
                  !isWaitingForDraw && (
                    <EmptySeats
                      count={1}
                      label={translate('host.table.nobody.seat')}
                    />
                  )
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
 * What the evening is, on paper: its name, how it is won, the games in the
 * order they come out of the box, and the way in.
 */
const TableCard: React.FC<{ roomCode: RoomCode; view: HostRoomView }> = ({
  roomCode,
  view
}) => {
  const translate = useTranslate()
  const { board, game, lineUp, roundCount, teams } = view.settings
  const isBySeat = teams.kind === 'off'
  const names = useLineUpEntryNames(lineUp)
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
      {isEvening && (
        <ol className='line-up-spines'>
          {lineUp.map((entry, index) => (
            <li
              // Every entry's name is its own: two of one game are numbered.
              key={names[index]}
              style={{
                '--spine': `var(--spine-${entry.kind})`,
                '--spine-ink': `var(--on-spine-${entry.kind})`
              }}
            >
              <GameIcon game={entry.kind} />
              {names[index]}
            </li>
          ))}
        </ol>
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
          {!player.isConnected && (
            <span className='state'>{translate('player.away')}</span>
          )}
          {player.id === youId && (
            <VisuallyHidden elementType='span'>{` (${translate('player.you')})`}</VisuallyHidden>
          )}
        </li>
      ))}
    </ul>
  )
}

/** A dashed place on the table for each seat still to come, with what fills it. */
const EmptySeats: React.FC<{ count: number; label: string }> = ({
  count,
  label
}) => (
  <ul aria-hidden='true' className='seat-chips empty-seats'>
    {Array.from({ length: count }, (_, seat) => seat).map((seat) => (
      <li className='empty-seat' key={seat}>
        {label}
      </li>
    ))}
  </ul>
)
