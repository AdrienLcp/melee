import type { RoundTurn } from '@melee/protocol/room'
import type { TeamId } from '@melee/protocol/team'

import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import { setOrder } from '@melee/core/team/set-order'

import type { Room, TeamSet } from '@/domain/room/room'
import { seatsOf } from '@/domain/room/team-service'

/** The teams a set opened now would take turns between: every one with a seat. */
const teamsInPlay = (room: Room): TeamId[] =>
  room.teams
    .filter((team) => seatsOf(room, team.id).length > 0)
    .map((team) => team.id)

/**
 * Whether the round about to open could be one team's. A race cannot be — the
 * buzzer mode, the bare buzzer and the reflex race are decided *between*
 * players. Asked before the seats still without a team are placed, so it reads
 * the teams the room keeps rather than who already sits in them; a set needs
 * two of them holding seats, which `takeTurn` counts once they are placed.
 */
export const canPlayByTeam = (room: Room): boolean => {
  const game = room.settings.game

  return (
    game !== null &&
    capabilitiesOf(game.kind).playsInTeamTurns &&
    room.settings.mode.kind !== 'buzzer' &&
    room.teams.length > 1
  )
}

/** Whether a set has a team still waiting for its round. */
export const hasTurnsLeft = (room: Room): boolean =>
  room.set !== null && room.set.played < room.set.order.length

/** The set's next turn, and `null` once every team has had one. */
const takeTurnOf = (set: TeamSet): RoundTurn | null => {
  const index = set.played
  const teamId = set.order[index]

  if (teamId === undefined) {
    return null
  }

  set.played += 1

  return { index, of: set.order.length, teamId }
}

/**
 * The team the round about to open belongs to, or `null` when everyone plays
 * it. A set under way hands out its next turn as long as the room still plays
 * the game it opened on; otherwise a new set opens when the host asked for
 * sets and the room can play one.
 */
export const takeTurn = (room: Room): RoundTurn | null => {
  const game = room.settings.game

  const set = room.set

  if (set !== null && set.game === game?.kind && canPlayByTeam(room)) {
    const turn = takeTurnOf(set)

    if (turn !== null) {
      return turn
    }
  }

  room.set = null

  const teamIds = teamsInPlay(room)

  // One team holding every seat is not a set: it is the room playing together.
  if (
    game === null ||
    !room.playsByTeam ||
    !canPlayByTeam(room) ||
    teamIds.length < 2
  ) {
    return null
  }

  const opened: TeamSet = {
    game: game.kind,
    order: setOrder({ setsPlayed: room.setsPlayed, teamIds }),
    played: 0
  }

  room.set = opened
  room.setsPlayed += 1

  return takeTurnOf(opened)
}
