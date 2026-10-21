import type { RoundTurn } from '@melee/protocol/room'
import type { TeamId } from '@melee/protocol/team'

import { setOrder } from '@melee/core/team/set-order'
import { canPlayByTeam as canGamePlayByTeam } from '@melee/core/team/team-turn'
import { drawDuel, soloSeat, type TeamSeats } from '@melee/core/team/turn-seats'

import type { Room, TeamSet } from '@/domain/room/room'
import { seatsOf } from '@/domain/room/team-service'

/** The teams a set opened now would take turns between: every one with a seat. */
const teamsInPlay = (room: Room): TeamId[] =>
  room.teams
    .filter((team) => seatsOf(room, team.id).length > 0)
    .map((team) => team.id)

/**
 * Whether the round about to open could be one team's. Asked before the seats
 * still without a team are placed, so it reads the teams the room keeps rather
 * than who already sits in them; a set needs two of them holding seats, which
 * `takeTurn` counts once they are placed.
 */
export const canPlayByTeam = (room: Room): boolean =>
  canGamePlayByTeam({
    game: room.settings.game?.kind ?? null,
    mode: room.settings.mode.kind,
    teamCount: room.teams.length
  })

/** Whether a set has a team still waiting for its round. */
export const hasTurnsLeft = (room: Room): boolean =>
  room.set !== null && room.set.played < room.set.order.length

/** The teams a turn may be drawn from, with who sits in each. */
const teamSeatsOf = (room: Room): TeamSeats[] =>
  room.teams.map((team) => ({
    id: team.id,
    seatIds: seatsOf(room, team.id).map((participant) => participant.id)
  }))

/**
 * The set's next turn, and `null` once every team has had one. In solo the
 * turn names the seat answering for its team, and a team whose seats have all
 * gone since the set opened is passed over rather than handed a turn nobody
 * can play.
 */
const takeTurnOf = (room: Room, set: TeamSet): RoundTurn | null => {
  const index = set.played
  const teamId = set.order[index]

  if (teamId === undefined) {
    return null
  }

  set.played += 1

  if (set.style === 'byTeam') {
    return {
      index,
      of: set.order.length,
      seatIds: null,
      style: 'byTeam',
      teamIds: [teamId]
    }
  }

  const seatId = soloSeat({
    seatIds: seatsOf(room, teamId).map((participant) => participant.id),
    setsPlayed: set.setsBefore
  })

  if (seatId === null) {
    return takeTurnOf(room, set)
  }

  return {
    index,
    of: set.order.length,
    seatIds: [seatId],
    style: 'solo',
    teamIds: [teamId]
  }
}

/** A duel is a set of one: two seats drawn, counted, and the round is theirs. */
const takeDuel = (room: Room): RoundTurn | null => {
  const duel = drawDuel({
    duelsBySeat: room.duelsBySeat,
    teams: teamSeatsOf(room)
  })

  if (duel === null) {
    return null
  }

  for (const seatId of duel.seatIds) {
    room.duelsBySeat.set(seatId, (room.duelsBySeat.get(seatId) ?? 0) + 1)
  }

  return {
    index: 0,
    of: 1,
    seatIds: duel.seatIds,
    style: 'duel',
    teamIds: duel.teamIds
  }
}

/**
 * Who the round about to open belongs to, or `null` when everyone plays it. A
 * set under way hands out its next turn as long as the room still plays the
 * game it opened on; otherwise a new set or a duel opens when the host asked
 * for one and the room can play it.
 */
export const takeTurn = (room: Room): RoundTurn | null => {
  const game = room.settings.game

  const set = room.set

  if (set !== null && set.game === game?.kind && canPlayByTeam(room)) {
    const turn = takeTurnOf(room, set)

    if (turn !== null) {
      return turn
    }
  }

  room.set = null

  const teamIds = teamsInPlay(room)
  const style = room.playStyle

  // One team holding every seat is not a set: it is the room playing together.
  if (
    game === null ||
    style === 'together' ||
    !canPlayByTeam(room) ||
    teamIds.length < 2
  ) {
    return null
  }

  if (style === 'duel') {
    return takeDuel(room)
  }

  const opened: TeamSet = {
    game: game.kind,
    order: setOrder({ setsPlayed: room.setsPlayed, teamIds }),
    played: 0,
    setsBefore: room.setsPlayed,
    style
  }

  room.set = opened
  room.setsPlayed += 1

  return takeTurnOf(room, opened)
}
