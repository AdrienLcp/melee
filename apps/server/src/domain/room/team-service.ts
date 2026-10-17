import { Result } from '@adrienlcp/result'

import type { PlayerId } from '@melee/protocol/identifiers'
import type {
  Team,
  TeamId,
  TeamName,
  TeamsSettings
} from '@melee/protocol/team'

import { teamForLateSeat } from '@melee/core/team/late-seat'
import { teamCountOf, teamIdAt } from '@melee/core/team/team-count'
import { isFairDeal } from '@melee/core/team/team-draw'
import { teamRoundResult } from '@melee/core/team/team-score'

import type { Participant, Room, RoomTeam } from './room'
import { touch } from './room-service'

export type TeamRejection = 'teams_locked'

const seatsOf = (room: Room, teamId: TeamId): Participant[] =>
  [...room.players.values()].filter(
    (participant) => participant.teamId === teamId
  )

const findTeam = (room: Room, teamId: TeamId): RoomTeam | undefined =>
  room.teams.find((team) => team.id === teamId)

/**
 * Whether a settings frame moves the teams. Only the lobby may: a count or a
 * way of dealing changed mid-game would reshuffle a board half an evening
 * long, and once the game is under way a team changes one seat at a time.
 */
export const changesTeams = ({
  from,
  to
}: {
  from: TeamsSettings
  to: TeamsSettings
}): boolean => teamCountOf(from) !== teamCountOf(to) || from.kind !== to.kind

/**
 * Keeps the room's teams as many as the setting counts. A team beyond the new
 * count goes and its seats wait for the next deal; the teams that stay keep
 * their names, their seats and their scores.
 */
export const fitTeamsToSettings = (room: Room): void => {
  const count = teamCountOf(room.settings.teams)

  room.teams = Array.from(
    { length: count },
    (_, index): RoomTeam =>
      room.teams[index] ?? {
        bankedScore: 0,
        colour: index + 1,
        id: teamIdAt(index),
        name: null
      }
  )

  for (const participant of room.players.values()) {
    if (
      participant.teamId !== null &&
      findTeam(room, participant.teamId) === undefined
    ) {
      participant.teamId = null
    }
  }
}

export const drawTeams = ({
  assignment,
  now,
  room
}: {
  assignment: readonly (readonly PlayerId[])[]
  now: number
  room: Room
}): Result<void, TeamRejection> => {
  if (
    room.phase !== 'lobby' ||
    room.settings.teams.kind !== 'drawn' ||
    assignment.length !== room.teams.length ||
    !isFairDeal({ assignment, seatIds: [...room.players.keys()] })
  ) {
    return Result.failure('teams_locked')
  }

  room.teams.forEach((team, index) => {
    for (const seatId of assignment[index] ?? []) {
      const participant = room.players.get(seatId)

      if (participant !== undefined) {
        participant.teamId = team.id
      }
    }
  })

  touch(room, now)

  return Result.success()
}

/**
 * A seat picking its own team: in the lobby of a room whose teams are chosen,
 * as often as it likes. Past the lobby a seat that arrived late and holds none
 * may pick once — after that, only the host moves it.
 */
export const chooseTeam = ({
  now,
  participant,
  room,
  teamId
}: {
  now: number
  participant: Participant
  room: Room
  teamId: TeamId
}): Result<void, TeamRejection> => {
  if (
    room.settings.teams.kind !== 'chosen' ||
    findTeam(room, teamId) === undefined ||
    (room.phase !== 'lobby' && participant.teamId !== null)
  ) {
    return Result.failure('teams_locked')
  }

  participant.teamId = teamId
  touch(room, now)

  return Result.success()
}

export const moveSeat = ({
  now,
  playerId,
  room,
  teamId
}: {
  now: number
  playerId: PlayerId
  room: Room
  teamId: TeamId
}): Result<void, TeamRejection> => {
  const participant = room.players.get(playerId)

  if (participant === undefined || findTeam(room, teamId) === undefined) {
    return Result.failure('teams_locked')
  }

  participant.teamId = teamId
  touch(room, now)

  return Result.success()
}

export const renameTeam = ({
  name,
  now,
  room,
  teamId
}: {
  name: TeamName
  now: number
  room: Room
  teamId: TeamId
}): Result<void, TeamRejection> => {
  const team = findTeam(room, teamId)

  if (team === undefined) {
    return Result.failure('teams_locked')
  }

  team.name = name
  touch(room, now)

  return Result.success()
}

/**
 * Points by hand. A team's adjustment is banked straight away, and either kind
 * stops at zero: a board with a negative score on it is a board nobody can
 * read across a room.
 */
export const adjustScore = ({
  now,
  points,
  room,
  target
}: {
  now: number
  points: number
  room: Room
  target:
    | { kind: 'seat'; playerId: PlayerId }
    | { kind: 'team'; teamId: TeamId }
}): Result<void, TeamRejection | 'invalid_message'> => {
  if (target.kind === 'seat') {
    const participant = room.players.get(target.playerId)

    if (participant === undefined) {
      return Result.failure('invalid_message')
    }

    participant.score = Math.max(0, participant.score + points)
    touch(room, now)

    return Result.success()
  }

  const team = findTeam(room, target.teamId)

  if (team === undefined) {
    return Result.failure('teams_locked')
  }

  team.bankedScore = Math.max(
    -liveRoundResult(room, team.id),
    team.bankedScore + points
  )
  touch(room, now)

  return Result.success()
}

/**
 * Where a seat with no team goes under `drawn` once there is a deal to join —
 * after the first draw, or once the game is under way. Before that the lobby is
 * still filling and the host has not dealt; the seat waits for the deal.
 */
export const placeArrivingSeat = (
  room: Room,
  participant: Participant
): void => {
  const hasDeal = [...room.players.values()].some(
    (seat) => seat.teamId !== null
  )

  if (
    participant.teamId === null &&
    room.settings.teams.kind === 'drawn' &&
    (room.phase !== 'lobby' || hasDeal)
  ) {
    placeSeat(room, participant)
  }
}

/** Every seat still without a team as a round opens, so *Start* never waits on a phone. */
export const placeUnseatedSeats = (room: Room): void => {
  for (const participant of room.players.values()) {
    if (participant.teamId === null) {
      placeSeat(room, participant)
    }
  }
}

const placeSeat = (room: Room, participant: Participant): void => {
  participant.teamId = teamForLateSeat(
    room.teams.map((team) => ({
      connectedSeatCount: seatsOf(room, team.id).filter(
        (seat) => seat.isConnected
      ).length,
      id: team.id
    }))
  )
}

const liveRoundResult = (room: Room, teamId: TeamId): number =>
  room.round === null
    ? 0
    : teamRoundResult({
        awards: room.round.awards,
        openedWithPlayerIds: room.round.openedWithPlayerIds,
        seatIds: seatsOf(room, teamId).map((seat) => seat.id)
      })

/**
 * The round on screen paid into each team for good, called just before it is
 * left behind — by the next round, or by the final board.
 */
export const bankTeamRound = (room: Room): void => {
  for (const team of room.teams) {
    team.bankedScore += liveRoundResult(room, team.id)
  }
}

export const resetTeamScores = (room: Room): void => {
  for (const team of room.teams) {
    team.bankedScore = 0
  }
}

export const toTeamViews = (room: Room): Team[] =>
  room.teams.map((team) => ({
    colour: team.colour,
    id: team.id,
    name: team.name,
    score: team.bankedScore + liveRoundResult(room, team.id),
    seatIds: seatsOf(room, team.id).map((seat) => seat.id)
  }))
