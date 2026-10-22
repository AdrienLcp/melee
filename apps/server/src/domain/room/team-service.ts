import { Result } from '@adrienlcp/result'

import type { BoardPosition } from '@melee/protocol/board'
import type { PlayerId } from '@melee/protocol/identifiers'
import { POINT } from '@melee/protocol/scoring'
import {
  PAWN_COLOUR_COUNT,
  type Team,
  type TeamId,
  type TeamName,
  type TeamsSettings
} from '@melee/protocol/team'

import { advanceOnTrack, type TeamMove } from '@melee/core/board/board-strategy'
import { teamForLateSeat } from '@melee/core/team/late-seat'
import { teamCountOf, teamIdAt } from '@melee/core/team/team-count'
import { isFairDeal } from '@melee/core/team/team-draw'
import { teamRoundResult } from '@melee/core/team/team-score'

import type { Participant, Room, RoomTeam } from './room'
import { touch } from './room-service'

export type TeamRejection = 'teams_locked'

export const seatsOf = (room: Room, teamId: TeamId): Participant[] =>
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

const newTeam = (index: number): RoomTeam => ({
  bankedCase: 0,
  bankedScore: 0,
  colour: (index % PAWN_COLOUR_COUNT) + 1,
  id: teamIdAt(index),
  name: null
})

/**
 * Under `teamsOnly` a seat is a team: it gets one of its own as it arrives. In
 * the lobby it takes over a team its last seat left, so a phone that joined
 * twice leaves no empty team on the board; past it, a fresh one, because the
 * team left behind still owns its score.
 */
const giveSeatItsOwnTeam = (room: Room, participant: Participant): void => {
  const vacant =
    room.phase === 'lobby'
      ? room.teams.find((team) => seatsOf(room, team.id).length === 0)
      : undefined
  const team = vacant ?? newTeam(room.teams.length)

  if (vacant === undefined) {
    room.teams.push(team)
  }

  participant.teamId = team.id
}

/**
 * Keeps the room's teams as many as the setting counts. A team beyond the new
 * count goes and its seats wait for the next deal; the teams that stay keep
 * their names, their seats and their scores.
 */
export const fitTeamsToSettings = (room: Room): void => {
  if (room.settings.teams.kind === 'teamsOnly') {
    fitTeamPerSeat(room)

    return
  }

  const count = teamCountOf(room.settings.teams)

  room.teams = Array.from(
    { length: count },
    (_, index): RoomTeam => room.teams[index] ?? newTeam(index)
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

const fitTeamPerSeat = (room: Room): void => {
  room.teams = []

  for (const participant of room.players.values()) {
    giveSeatItsOwnTeam(room, participant)
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
 *
 * On a track a team's adjustment walks its pawn too, a case for each whole
 * `POINT`, which is how the host corrects a move under the reveal — one
 * correction for the two, so the pawn and the score never tell different
 * stories.
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

  if (room.settings.board.kind === 'track') {
    const move = liveMoveOf(room, team.id)

    team.bankedCase = Math.min(
      room.settings.board.length - move,
      Math.max(-move, team.bankedCase + Math.trunc(points / POINT))
    )
  }

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

  if (participant.teamId === null && room.settings.teams.kind === 'teamsOnly') {
    giveSeatItsOwnTeam(room, participant)

    return
  }

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
  if (room.settings.teams.kind === 'teamsOnly') {
    giveSeatItsOwnTeam(room, participant)

    return
  }

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
        answersAsOne:
          room.round.duel !== null || room.round.content.kind === 'challenge',
        awards: room.round.awards,
        openedWithPlayerIds: room.round.openedWithPlayerIds,
        seatIds: seatsOf(room, teamId).map((seat) => seat.id)
      }) +
      room.round.teamAwards
        .filter((award) => award.teamId === teamId)
        .reduce((total, award) => total + award.points, 0)

/**
 * What the round on screen walks each pawn, from the cases they stood on
 * before it. Empty on a room whose board is off.
 */
const liveMoves = (room: Room): TeamMove[] => {
  const { board } = room.settings

  if (board.kind === 'off' || room.round === null) {
    return []
  }

  return advanceOnTrack({
    catchUp: board.catchUp,
    length: board.length,
    positions: new Map(room.teams.map((team) => [team.id, team.bankedCase])),
    results: room.teams.map((team) => ({
      points: liveRoundResult(room, team.id),
      teamId: team.id
    })),
    strategy: board.strategy
  }).moves
}

const liveMoveOf = (room: Room, teamId: TeamId): number =>
  liveMoves(room).find((move) => move.teamId === teamId)?.cases ?? 0

/**
 * The round on screen paid into each team for good, called just before it is
 * left behind — by the next round, or by the final board.
 */
export const bankTeamRound = (room: Room): void => {
  const moves = liveMoves(room)

  for (const team of room.teams) {
    team.bankedScore += liveRoundResult(room, team.id)
    team.bankedCase += moves.find((move) => move.teamId === team.id)?.cases ?? 0
  }
}

export const resetTeamScores = (room: Room): void => {
  for (const team of room.teams) {
    team.bankedCase = 0
    team.bankedScore = 0
  }
}

/**
 * The pawn as every screen draws it. The round's move shows from its reveal
 * and not before: a pawn that walks while the round is open has said who is
 * answering right.
 */
const boardPositionOf = (
  room: Room,
  team: RoomTeam,
  moves: readonly TeamMove[]
): BoardPosition | null => {
  if (room.settings.board.kind === 'off') {
    return null
  }

  const move =
    room.phase === 'revealed'
      ? (moves.find((entry) => entry.teamId === team.id)?.cases ?? 0)
      : 0

  return { case: team.bankedCase + move, move }
}

/** A `teamsOnly` team is named after the seat it is: the name typed on its screen. */
const nameOfOnlySeat = (room: Room, team: RoomTeam): TeamName | null =>
  room.settings.teams.kind === 'teamsOnly'
    ? (seatsOf(room, team.id)[0]?.nickname ?? null)
    : null

export const toTeamViews = (room: Room): Team[] => {
  const moves = liveMoves(room)

  return room.teams.map((team) => ({
    board: boardPositionOf(room, team, moves),
    colour: team.colour,
    id: team.id,
    name: team.name ?? nameOfOnlySeat(room, team),
    score: team.bankedScore + liveRoundResult(room, team.id),
    seatIds: seatsOf(room, team.id).map((seat) => seat.id)
  }))
}
