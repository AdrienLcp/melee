import { useEffect, useEffectEvent, useRef } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { HostRoomView } from '@melee/protocol/room'

import { suggestedTeamCount, teamCountOf } from '@melee/core/team/team-count'
import { dealTeams } from '@melee/core/team/team-draw'

import type { StageControls } from './room-stage'

/** A drawn table's deal, as every press that can deal it reads it. */
export type TeamDeal = {
  /** Shuffles every seat into the count the room is set to. */
  deal: () => void
  /** Some seat already sits in a team, so the next press deals again. */
  hasDealt: boolean
  /** Teams are drawn here, rather than chosen by each seat or played aloud. */
  isDrawn: boolean
  /** Fewer seats than teams: the server refuses a deal that leaves one empty. */
  isShortOfPlayers: boolean
}

export const useTeamDeal = ({
  send,
  view
}: {
  send: ((message: ClientMessage) => boolean) | null
  view: HostRoomView
}): TeamDeal => {
  const teams = view.settings.teams
  const isDrawn = teams.kind === 'drawn'
  const seatIds = view.players.map((player) => player.id)

  return {
    deal: () => {
      send?.({
        assignment: dealTeams({ count: teamCountOf(teams), seatIds }),
        type: 'host.drawTeams'
      })
    },
    hasDealt: view.teams.some((team) => team.seatIds.length > 0),
    isDrawn,
    isShortOfPlayers: isDrawn && seatIds.length < teamCountOf(teams)
  }
}

/**
 * A drawn table's count, kept in step with the room while nobody has said
 * otherwise. Until the host picks a count or deals, it follows the headcount —
 * a host who has never opened the setup still splits twelve people in four.
 * A count the host picks, wherever it was picked, ends that; and a new count
 * after a deal deals again, because the server lets the seats of a team it
 * takes out wait for the next deal.
 *
 * Mounted once per console, on its lobby stage: two of it would send every
 * frame twice.
 */
export const useTeamCountFollowingHeadcount = ({
  controls,
  view
}: {
  /** `null` on the wall, which follows nothing and deals nothing. */
  controls: StageControls | null
  view: HostRoomView
}): void => {
  const send = controls?.send ?? null
  const isLive = controls?.isLive === true
  const { hasDealt, isDrawn } = useTeamDeal({ send, view })
  const hasChosenCount = useRef(false)
  const followedTo = useRef<number | null>(null)
  const previousCount = useRef(teamCountOf(view.settings.teams))
  const count = teamCountOf(view.settings.teams)
  const suggested = suggestedTeamCount(view.players.length)
  const followsHeadcount = isLive && isDrawn && !hasDealt && count !== suggested

  const answerNewCount = useEffectEvent((next: number) => {
    if (followedTo.current === next) {
      followedTo.current = null

      return
    }

    hasChosenCount.current = true

    if (isLive && isDrawn && hasDealt && view.players.length >= next) {
      send?.({
        assignment: dealTeams({
          count: next,
          seatIds: view.players.map((player) => player.id)
        }),
        type: 'host.drawTeams'
      })
    }
  })

  const follow = useEffectEvent((next: number) => {
    if (hasChosenCount.current) {
      return
    }

    followedTo.current = next
    controls?.onSettingsChange({
      ...view.settings,
      teams: { count: next, kind: 'drawn' }
    })
  })

  // Ahead of the follow: the snapshot carrying a count the host picked is
  // also one whose count no longer matches the headcount.
  useEffect(() => {
    if (previousCount.current === count) {
      return
    }

    previousCount.current = count
    answerNewCount(count)
  }, [count])

  useEffect(() => {
    if (followsHeadcount) {
      follow(suggested)
    }
  }, [followsHeadcount, suggested])
}
