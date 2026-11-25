import type React from 'react'
import { useRef, useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, PublicPlayer } from '@melee/protocol/room'

import {
  buildRoster,
  buildScoreboard,
  hasAnybodyScored
} from '@melee/core/scoring/scoreboard'

import { shownPoints } from '@/helpers/shown-points'
import { CaseMark } from '@/presentation/components/case-mark'
import { Pawn } from '@/presentation/components/pawn'
import {
  PointsRows,
  usePointsRows
} from '@/presentation/components/points-rows'
import { ReadyMark } from '@/presentation/components/ready-mark'
import { useLeavingRows } from '@/presentation/components/use-leaving-rows'
import { useRowsTravel } from '@/presentation/components/use-rows-travel'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { RemoveSeat } from './remove-seat'
import { SeatStanding } from './seat-standing'

import './podium-roster.sass'

const ROW_EXIT_ANIMATION = 'page-leave'

type PodiumRosterProps = {
  /** What an empty table says in the list's place. */
  empty: React.ReactNode
  /** Takes a seat off the table. Never offered on this console's own seat. */
  onRemovePlayer: (playerId: PlayerId) => void
  view: HostRoomView
}

/**
 * Who is at the table, ranked, in one list, one line a seat: once the game
 * runs, each seat's standing is the press that opens its `−`, `+` and
 * removal; before it, the removal is the row's own cross. In a room of teams the
 * presses are the teams', drawn under the seats, because a seat's adjustment
 * never reaches its team. The console's roster, beside a wall or on its own.
 */
export const PodiumRoster: React.FC<PodiumRosterProps> = ({
  empty,
  onRemovePlayer,
  view
}) => {
  const translate = useTranslate()
  const points = usePointsRows()
  const list = useRef<HTMLOListElement>(null)

  const isInLobby = view.phase === 'lobby'
  const isBetweenRounds = view.phase === 'revealed'
  const isByTeam = view.teams.length > 0
  const board = view.settings.board
  const isOnTrack = board.kind === 'track'
  // A team walks the pawn on a track, so a seat there has no standing of its
  // own to print, and a rank read off its points would be one nobody sees.
  const seatsStand = !(isByTeam && isOnTrack)
  const isRanked = seatsStand && hasAnybodyScored(view.players)
  const ranked = (seatsStand ? buildScoreboard : buildRoster)(view.players)
  const seatPresses = isByTeam ? null : points
  const sharesRank = (rank: number) =>
    ranked.filter((entry) => entry.rank === rank).length > 1

  // The order is read again as the phase turns, never on a press: a row
  // re-ranked under the thumb sent the next `+` to the seat that took its
  // place. A seat that joins meanwhile goes last, and the rank each prints
  // stays live.
  const [heldOrder, setHeldOrder] = useState(() => ({
    ids: ranked.map(({ player }) => player.id),
    phase: view.phase
  }))

  if (heldOrder.phase !== view.phase) {
    setHeldOrder({
      ids: ranked.map(({ player }) => player.id),
      phase: view.phase
    })
  }

  const { endExitOf, rows } = useLeavingRows({
    exitAnimation: ROW_EXIT_ANIMATION,
    rows: inHeldOrder({ held: heldOrder.ids, ranked }).map((entry) => ({
      ...entry,
      id: entry.player.id
    }))
  })

  // A seat that joins makes room between its neighbours, one that leaves is
  // closed up behind, and a seat a score lifts travels to its new place.
  useRowsTravel({
    list,
    order: rows.map(({ id }) => id).join(' '),
    pace: 'gather'
  })

  if (view.players.length === 0) {
    return <p className='podium-empty'>{empty}</p>
  }

  return (
    <div className='podium-roster-column'>
      <ol className='podium-roster' ref={list}>
        {rows.map(({ isArriving, isLeaving, player, rank }) => {
          const row = seatPresses?.rows.find((each) => each.id === player.id)
          const isYou = player.id === view.youId
          const notes = [
            isYou && translate('player.you'),
            !player.isConnected && translate('player.away'),
            isRanked && sharesRank(rank) && translate('host.podium.tied')
          ].filter((note) => note !== false)
          // One action is a press of its own; once the standing opens, the
          // removal goes behind it with the − and +.
          const isStandingAPress =
            seatsStand &&
            seatPresses !== null &&
            row !== undefined &&
            !isInLobby
          const isRemovedFromRow = !isYou && !isStandingAPress
          const removeThis = () => {
            onRemovePlayer(player.id)
          }
          const standing =
            board.kind === 'track'
              ? player.board !== null && (
                  <CaseMark at={player.board.case} length={board.length} />
                )
              : translate('player.score', { points: shownPoints(player.score) })

          return (
            <li
              aria-hidden={isLeaving || undefined}
              className='podium-seat'
              data-arrived={isArriving || undefined}
              data-away={!player.isConnected || undefined}
              data-key={player.id}
              data-leads={(isRanked && rank === 1) || undefined}
              data-leaving={isLeaving || undefined}
              data-you={isYou || undefined}
              inert={isLeaving}
              key={player.id}
              onAnimationEnd={isLeaving ? endExitOf(player.id) : undefined}
            >
              <span className='podium-rank'>{isRanked ? rank : ''}</span>
              <Pawn
                seat={view.players.findIndex((seat) => seat.id === player.id)}
              />
              <span className='podium-who'>
                <span className='podium-line'>
                  <span className='podium-name'>{player.nickname}</span>
                  {isBetweenRounds && <ReadyMark isReady={player.isReady} />}
                </span>
                {notes.length > 0 && (
                  <span className='podium-note'>{notes.join(' · ')}</span>
                )}
              </span>
              {seatsStand && (
                <span
                  className='podium-tally'
                  data-open={!isInLobby || undefined}
                  inert={isInLobby}
                >
                  <span className='podium-tally-pieces'>
                    {seatPresses !== null && row !== undefined ? (
                      <SeatStanding
                        isLive={seatPresses.isLive}
                        nickname={player.nickname}
                        onRemove={isYou ? null : removeThis}
                        onStep={(direction) => {
                          seatPresses.onStep(row, direction)
                        }}
                        row={row}
                        standing={standing}
                      />
                    ) : (
                      <span className='podium-score'>{standing}</span>
                    )}
                  </span>
                </span>
              )}
              <span
                className='podium-remove'
                data-open={isRemovedFromRow || undefined}
                inert={!isRemovedFromRow}
              >
                <span>
                  {!isYou && (
                    <RemoveSeat
                      nickname={player.nickname}
                      onRemove={removeThis}
                    />
                  )}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
      {isByTeam && (
        <div
          className='podium-team-fold'
          data-open={!isInLobby || undefined}
          inert={isInLobby}
        >
          <section className='podium-team-points'>
            <h3>{translate(isOnTrack ? 'board.fix' : 'host.points.label')}</h3>
            <PointsRows />
          </section>
        </div>
      )}
    </div>
  )
}

/** The seats in the order held, those it does not hold yet after them in rank order. */
const inHeldOrder = <Entry extends { player: PublicPlayer }>({
  held,
  ranked
}: {
  held: readonly PlayerId[]
  ranked: readonly Entry[]
}): Entry[] => {
  const placeOf = (entry: Entry) => {
    const at = held.indexOf(entry.player.id)

    return at === -1 ? held.length : at
  }

  return ranked.toSorted((one, other) => placeOf(one) - placeOf(other))
}

/**
 * The roster read in one line, for a screen that folds it: the first three
 * seats with where each stands — on a track, the case as the track draws it —
 * then how many more.
 */
export const useRosterSummary = (view: HostRoomView): React.ReactNode => {
  const translate = useTranslate()

  if (view.players.length === 0) {
    return translate('team.empty')
  }

  const { board } = view.settings
  const isRanked = hasAnybodyScored(view.players)
  const ranked = buildScoreboard(view.players)
  const standingOf = (player: PublicPlayer): React.ReactNode => {
    if (board.kind === 'points') {
      return translate('player.score', { points: shownPoints(player.score) })
    }

    return player.board === null ? null : (
      <CaseMark at={player.board.case} length={board.length} />
    )
  }
  const more = ranked.length - 3

  return (
    <>
      {ranked.slice(0, 3).map(({ player }, index) => (
        <span className='roster-summary-seat' key={player.id}>
          {index > 0 && ' · '}
          {player.nickname}
          {isRanked && <> {standingOf(player)}</>}
        </span>
      ))}
      {more > 0 && ` ${translate('host.podium.more', { count: more })}`}
    </>
  )
}
