import { Result } from '@adrienlcp/result'

import type { BoardPosition } from '@melee/protocol/board'
import type { ScoreChange } from '@melee/protocol/client-message'
import type { PlayerId } from '@melee/protocol/identifiers'
import {
  DEFAULT_TEAMS_SETTINGS,
  MIN_TEAMS,
  PAWN_COLOUR_COUNT,
  type Team,
  type TeamId,
  type TeamName,
  type TeamsSettings
} from '@melee/protocol/team'

import {
  advanceOnTrack,
  type PawnId,
  type PawnMove
} from '@melee/core/board/board-strategy'
import { hasJoinedAfterStart } from '@melee/core/round/round-roster'
import { teamForLateSeat } from '@melee/core/team/late-seat'
import {
  fieldsTeams,
  mostTeamsFor,
  teamCountOf,
  teamIdAt
} from '@melee/core/team/team-count'
import { isFairDeal } from '@melee/core/team/team-draw'
import { type PaidSeat, teamRoundResult } from '@melee/core/team/team-score'

import { isSpokenRound } from '@/domain/round/black-square-round'

import type { Participant, Room, RoomTeam } from './room'
import { touch } from './room-service'

export type TeamRejection = 'colour_taken' | 'teams_locked'

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

/**
 * The first pawn colour no team holds: a team added after another was
 * repainted must not take the colour that one moved to.
 */
const freeColourFor = (teams: readonly RoomTeam[]): number => {
  const taken = new Set(teams.map((team) => team.colour))

  return (
    Array.from({ length: PAWN_COLOUR_COUNT }, (_, index) => index + 1).find(
      (colour) => !taken.has(colour)
    ) ?? 1
  )
}

const newTeam = ({
  index,
  teams
}: {
  index: number
  teams: readonly RoomTeam[]
}): RoomTeam => ({
  bankedCase: 0,
  bankedScore: 0,
  colour: freeColourFor(teams),
  id: teamIdAt(index),
  name: null
})

/**
 * Keeps the room's teams as many as the setting counts. A team beyond the new
 * count goes and its seats wait for the next deal; the teams that stay keep
 * their names, their seats and their scores.
 */
export const fitTeamsToSettings = (room: Room): void => {
  const count = teamCountOf(room.settings.teams)

  const teams = room.teams.slice(0, count)

  while (teams.length < count) {
    teams.push(newTeam({ index: teams.length, teams }))
  }

  room.teams = teams

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

/**
 * The phases a team may change colour in: the lobby and between two rounds,
 * never while one plays, when its pawn changing colour loses the room the
 * track for the round.
 */
const RECOLOUR_PHASES: ReadonlySet<Room['phase']> = new Set([
  'finished',
  'lobby',
  'revealed'
])

export const recolourTeam = ({
  colour,
  now,
  room,
  teamId
}: {
  colour: number
  now: number
  room: Room
  teamId: TeamId
}): Result<void, TeamRejection> => {
  const team = findTeam(room, teamId)

  if (team === undefined || !RECOLOUR_PHASES.has(room.phase)) {
    return Result.failure('teams_locked')
  }

  if (room.teams.some((other) => other !== team && other.colour === colour)) {
    return Result.failure('colour_taken')
  }

  team.colour = colour
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
 * A correction by hand, in what the room plays for: points on points, cases on
 * a track — a change of the other kind is refused, because it would move a
 * figure no screen shows. A team's correction is banked straight away, and
 * either stops at zero: a negative standing is one nobody can read across a
 * room.
 */
export const adjustScore = ({
  change,
  now,
  room,
  target
}: {
  change: ScoreChange
  now: number
  room: Room
  target:
    | { kind: 'seat'; playerId: PlayerId }
    | { kind: 'team'; teamId: TeamId }
}): Result<void, TeamRejection | 'invalid_message'> => {
  if (
    change.kind !== (room.settings.board.kind === 'track' ? 'cases' : 'points')
  ) {
    return Result.failure('invalid_message')
  }

  if (target.kind === 'seat') {
    const participant = room.players.get(target.playerId)

    if (participant === undefined) {
      return Result.failure('invalid_message')
    }

    if (change.kind === 'points') {
      participant.score = Math.max(0, participant.score + change.points)
    } else if (room.teams.length === 0) {
      adjustCase({ cases: change.cases, holder: participant, room })
    } else {
      return Result.failure('invalid_message')
    }

    touch(room, now)

    return Result.success()
  }

  const team = findTeam(room, target.teamId)

  if (team === undefined) {
    return Result.failure('teams_locked')
  }

  if (change.kind === 'points') {
    team.bankedScore = Math.max(
      -liveRoundResult(room, team.id),
      team.bankedScore + change.points
    )
  } else {
    adjustCase({ cases: change.cases, holder: team, room })
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

/**
 * Turns the teams off when the table cannot field them, at the round that
 * takes the room out of the lobby: past it the teams are locked, so this is
 * the last moment a table of one is still told it plays alone. A count the
 * seats cannot fill comes down to the most they can, so the seats of the teams
 * it takes out are placed again rather than left as teams of one. Teams
 * answering aloud hold no seats and are the host's to count.
 */
export const standDownTeamsShortOfPlayers = (room: Room): void => {
  const { teams } = room.settings

  if (teams.kind !== 'drawn' && teams.kind !== 'chosen') {
    return
  }

  const mostTeams = mostTeamsFor(room.players.size)

  if (teams.count > mostTeams && mostTeams >= MIN_TEAMS) {
    room.settings = {
      ...room.settings,
      teams: { ...teams, count: mostTeams }
    }
    fitTeamsToSettings(room)
  }

  placeUnseatedSeats(room)

  const filledTeamCount = room.teams.filter(
    (team) => seatsOf(room, team.id).length > 0
  ).length

  if (fieldsTeams({ filledTeamCount, seatCount: room.players.size })) {
    return
  }

  room.settings = { ...room.settings, teams: DEFAULT_TEAMS_SETTINGS }
  fitTeamsToSettings(room)
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
    : liveSeatsResult({ awards: room.round.awards, room, teamId }) +
      room.round.teamAwards
        .filter((award) => award.teamId === teamId)
        .reduce((total, award) => total + award.points, 0)

/** What the team's seats earned on the round on screen, read off `awards`. */
const liveSeatsResult = ({
  awards,
  room,
  teamId
}: {
  awards: readonly PaidSeat[]
  room: Room
  teamId: TeamId
}): number =>
  room.round === null
    ? 0
    : teamRoundResult({
        answersAsOne:
          room.round.duel !== null ||
          room.round.content.kind === 'challenge' ||
          isSpokenRound(room.round),
        awards,
        openedWithPlayerIds: room.round.openedWithPlayerIds,
        scoring: room.settings.teamScoring,
        seatIds: seatsOf(room, teamId).map((seat) => seat.id)
      })

/** How much of the team's round the clock paid: its seats' results with and without their speed bonus. */
const liveSpeedBonus = (room: Room, teamId: TeamId): number => {
  const awards = room.round?.awards ?? []
  const answersOnly = awards.map((award) => ({
    playerId: award.playerId,
    points: award.points - award.speedBonus
  }))

  return (
    liveSeatsResult({ awards, room, teamId }) -
    liveSeatsResult({ awards: answersOnly, room, teamId })
  )
}

/** Whose pawn walks, what the round on screen paid it, and how much of that the clock did. */
type TrackPawn = {
  holder: Participant | RoomTeam
  points: number
  speedBonus: number
}

/**
 * The teams in a room that plays in teams, and every seat otherwise — save a
 * seat that arrived after the round opened, which plays from the next one and
 * so stands where it is through this one.
 */
const trackPawnsOf = (room: Room): TrackPawn[] => {
  if (room.teams.length > 0) {
    return room.teams.map((team) => ({
      holder: team,
      points: liveRoundResult(room, team.id),
      speedBonus: liveSpeedBonus(room, team.id)
    }))
  }

  const openedWithPlayerIds = room.round?.openedWithPlayerIds ?? null

  return [...room.players.values()]
    .filter(
      (seat) => !hasJoinedAfterStart({ openedWithPlayerIds, playerId: seat.id })
    )
    .map((seat) => {
      const awards = (room.round?.awards ?? []).filter(
        (award) => award.playerId === seat.id
      )

      return {
        holder: seat,
        points: awards.reduce((total, award) => total + award.points, 0),
        speedBonus: awards.reduce((total, award) => total + award.speedBonus, 0)
      }
    })
}

/**
 * What the round on screen walks each pawn, from the cases they stood on
 * before it. Empty on a room that plays for points.
 */
const liveMoves = (room: Room): PawnMove[] => {
  const { board } = room.settings

  if (board.kind === 'points' || room.round === null) {
    return []
  }

  const pawns = trackPawnsOf(room)

  return advanceOnTrack({
    catchUp: board.catchUp,
    length: board.length,
    positions: new Map(
      pawns.map((pawn) => [pawn.holder.id, pawn.holder.bankedCase])
    ),
    results: pawns.map((pawn) => ({
      pawnId: pawn.holder.id,
      points: pawn.points,
      speedBonus: pawn.speedBonus
    })),
    strategy: board.strategy
  }).moves
}

const moveOf = (moves: readonly PawnMove[], pawnId: PawnId): number =>
  moves.find((move) => move.pawnId === pawnId)?.cases ?? 0

/**
 * The round on screen paid into each team and each pawn for good, called just
 * before it is left behind — by the next round, or by the final board.
 */
export const bankRound = (room: Room): void => {
  const moves = liveMoves(room)

  for (const team of room.teams) {
    team.bankedScore += liveRoundResult(room, team.id)
  }

  for (const pawn of trackPawnsOf(room)) {
    pawn.holder.bankedCase += moveOf(moves, pawn.holder.id)
  }
}

/**
 * A host's correction walks the pawn, never behind the start nor past the end
 * once the round's own move is counted.
 */
const adjustCase = ({
  cases,
  holder,
  room
}: {
  cases: number
  holder: Participant | RoomTeam
  room: Room
}): void => {
  const { board } = room.settings

  if (board.kind === 'points') {
    return
  }

  const move = moveOf(liveMoves(room), holder.id)

  holder.bankedCase = Math.min(
    board.length - move,
    Math.max(-move, holder.bankedCase + cases)
  )
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
const boardPositionOf = ({
  holder,
  moves,
  room
}: {
  holder: Participant | RoomTeam
  moves: readonly PawnMove[]
  room: Room
}): BoardPosition | null => {
  if (room.settings.board.kind === 'points') {
    return null
  }

  const move = room.phase === 'revealed' ? moveOf(moves, holder.id) : 0

  return { case: holder.bankedCase + move, move }
}

/**
 * Each seat's pawn, in a room on a track that plays without teams; empty
 * otherwise, where a seat carries none.
 */
export const toSeatBoards = (room: Room): Map<PlayerId, BoardPosition> => {
  if (room.teams.length > 0 || room.settings.board.kind === 'points') {
    return new Map()
  }

  const moves = liveMoves(room)

  return new Map(
    [...room.players.values()].flatMap((seat) => {
      const position = boardPositionOf({ holder: seat, moves, room })

      return position === null ? [] : [[seat.id, position] as const]
    })
  )
}

export const toTeamViews = (room: Room): Team[] => {
  const moves = liveMoves(room)

  return room.teams.map((team) => {
    const roundResult = liveRoundResult(room, team.id)

    return {
      board: boardPositionOf({ holder: team, moves, room }),
      colour: team.colour,
      gain: room.phase === 'revealed' ? roundResult : 0,
      id: team.id,
      name: team.name,
      score: team.bankedScore + roundResult,
      seatIds: seatsOf(room, team.id).map((seat) => seat.id)
    }
  })
}
