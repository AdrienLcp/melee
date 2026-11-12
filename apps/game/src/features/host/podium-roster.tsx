import type React from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, PublicPlayer } from '@melee/protocol/room'
import { SCORE_ADJUSTMENT_STEP } from '@melee/protocol/scoring'

import {
  buildRoster,
  buildScoreboard,
  hasAnybodyScored
} from '@melee/core/scoring/scoreboard'

import { shownPoints } from '@/helpers/shown-points'
import {
  ActionMenu,
  ActionMenuItem
} from '@/presentation/components/action-menu'
import { Button } from '@/presentation/components/button'
import { CaseMark } from '@/presentation/components/case-mark'
import { CrossIcon, MinusIcon, PlusIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import {
  PointsRows,
  usePointsRows
} from '@/presentation/components/points-rows'
import { ReadyMark } from '@/presentation/components/ready-mark'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './podium-roster.sass'

type PodiumRosterProps = {
  /** Takes a seat off the table. Never offered on this console's own seat. */
  onRemovePlayer: (playerId: PlayerId) => void
  view: HostRoomView
}

/**
 * Who is at the table, ranked, each seat's points by hand on its own line once
 * the game runs and its removal behind a menu, so a press aimed at a `+` never
 * lands on the cross. In a room of teams the presses are the teams', drawn
 * under the seats, because a seat's adjustment never reaches its team.
 */
export const PodiumRoster: React.FC<PodiumRosterProps> = ({
  onRemovePlayer,
  view
}) => {
  const translate = useTranslate()
  const points = usePointsRows()

  if (view.players.length === 0) {
    return (
      <p className='podium-empty'>
        {translate('host.podium.empty', { code: view.code })}
      </p>
    )
  }

  const isInLobby = view.phase === 'lobby'
  const isBetweenRounds = view.phase === 'revealed'
  const isByTeam = view.teams.length > 0
  const board = view.settings.board
  const isOnTrack = board.kind === 'track'
  // A team walks the pawn on a track, so a seat there has no standing of its
  // own to print, and a rank read off its points would be one nobody sees.
  const seatsStand = !(isByTeam && isOnTrack)
  const isRanked = seatsStand && hasAnybodyScored(view.players)
  const ranked = seatsStand
    ? buildScoreboard(view.players)
    : buildRoster(view.players)
  const seatPresses = isInLobby || isByTeam ? null : points
  const sharesRank = (rank: number) =>
    ranked.filter((entry) => entry.rank === rank).length > 1

  return (
    <>
      <ol className='podium-roster'>
        {ranked.map(({ player, rank }) => {
          const row = seatPresses?.rows.find((each) => each.id === player.id)
          const isYou = player.id === view.youId
          const notes = [
            isYou && translate('player.you'),
            !player.isConnected && translate('player.away'),
            isRanked && sharesRank(rank) && translate('host.podium.tied')
          ].filter((note) => note !== false)

          return (
            <li
              className='podium-seat'
              data-away={!player.isConnected || undefined}
              data-leads={(isRanked && rank === 1) || undefined}
              data-you={isYou || undefined}
              key={player.id}
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
              <span className='podium-tally'>
                {seatPresses !== null && row !== undefined && (
                  <Button
                    aria-label={row.takeLabel}
                    isDisabled={!seatPresses.isLive || !row.canTake}
                    onPress={() => {
                      seatPresses.onStep(row, -1)
                    }}
                    size='small'
                    variant='outlined'
                  >
                    <MinusIcon />
                  </Button>
                )}
                <span className='podium-score'>
                  {!seatsStand
                    ? null
                    : board.kind === 'track'
                      ? player.board !== null && (
                          <CaseMark
                            at={player.board.case}
                            length={board.length}
                          />
                        )
                      : translate('player.score', {
                          points: shownPoints(player.score)
                        })}
                </span>
                {seatPresses !== null && row !== undefined && (
                  <Button
                    aria-label={row.giveLabel}
                    isDisabled={!seatPresses.isLive || !row.canGive}
                    onPress={() => {
                      seatPresses.onStep(row, 1)
                    }}
                    size='small'
                    variant='outlined'
                  >
                    <PlusIcon />
                  </Button>
                )}
              </span>
              {isYou ? (
                <span className='podium-menu-slot' />
              ) : (
                <ActionMenu
                  aria-label={translate('host.podium.actions', {
                    nickname: player.nickname
                  })}
                >
                  <ActionMenuItem
                    icon={<CrossIcon />}
                    isDestructive
                    onAction={() => {
                      onRemovePlayer(player.id)
                    }}
                  >
                    {translate('host.players.removeNamed', {
                      nickname: player.nickname
                    })}
                  </ActionMenuItem>
                </ActionMenu>
              )}
            </li>
          )
        })}
      </ol>
      {seatPresses !== null && (
        <p className='podium-hint'>
          {isOnTrack
            ? translate('host.podium.casesHint')
            : translate('host.podium.pointsHint', {
                points: shownPoints(SCORE_ADJUSTMENT_STEP)
              })}
        </p>
      )}
      {!isInLobby && isByTeam && (
        <section className='podium-team-points'>
          <h3>{translate(isOnTrack ? 'board.fix' : 'host.points.label')}</h3>
          <PointsRows />
        </section>
      )}
    </>
  )
}

/** The roster read in one line, for a screen that folds it: the first three seats, then how many more. */
export const useRosterSummary = (view: HostRoomView): string => {
  const translate = useTranslate()

  if (view.players.length === 0) {
    return translate('team.empty')
  }

  const ranked = buildScoreboard(view.players)
  const standingOf = (player: PublicPlayer): string | null => {
    if (view.settings.board.kind === 'points') {
      return translate('player.score', { points: shownPoints(player.score) })
    }

    return player.board === null
      ? null
      : translate('board.at', { case: player.board.case })
  }
  const firstThree = ranked
    .slice(0, 3)
    .map(({ player }) => {
      const standing = hasAnybodyScored(view.players)
        ? standingOf(player)
        : null

      return standing === null
        ? player.nickname
        : `${player.nickname} ${standing}`
    })
    .join(' · ')
  const more = ranked.length - 3

  return more > 0
    ? `${firstThree} ${translate('host.podium.more', { count: more })}`
    : firstThree
}
