import { Result } from '@adrienlcp/result'

import type {
  HostToken,
  Nickname,
  PlayerId,
  SessionId
} from '@melee/protocol/identifiers'
import { MAX_PLAYERS_PER_ROOM, type RoomSettings } from '@melee/protocol/room'
import type { PawnPiece } from '@melee/protocol/team'

import {
  isPawnPieceFree,
  pawnPieceForArrival
} from '@melee/core/board/pawn-piece'
import { randomUnit } from '@melee/core/helpers/random'
import { decksFollowingLineUp } from '@melee/core/room/evening-decks'
import { dealsOf } from '@melee/core/room/line-up-deals'
import { playedPerEntry } from '@melee/core/room/next-game'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import { dealtOrder } from '@melee/core/room/running-order'
import { isAbandoned } from '@melee/core/room/seat-presence'

import type { Participant, Room } from './room'

export type JoinError = 'room_full' | 'nickname_taken' | 'room_plays_aloud'
export type HostClaimError = 'host_already_connected' | 'host_reconnecting'

export const touch = (room: Room, now: number): void => {
  room.lastActivityAt = now
}

/**
 * A player who reloads, locks their screen or drops off Wi-Fi comes back with
 * the `sessionId` they stored, and reclaims the same seat and score. Only when
 * no seat matches is a new participant created — which is why the nickname
 * clash check runs against *other* participants, never against the returning
 * one.
 *
 * **A returning seat keeps the name it holds**, whatever the `hello` says.
 * Renaming is `player.rename`'s job, and a screen that renamed itself carries
 * the old name in memory until it reloads: honouring the hello here would let a
 * Wi-Fi blink undo a rename nobody asked to undo. The pawn's piece follows the
 * same rule: `askedPiece` is asked for a new seat only.
 */
export const joinAsPlayer = ({
  askedPiece,
  newPlayerId,
  nickname,
  now,
  room,
  sessionId
}: {
  /** The piece this device last played as, and `null` from one that never picked. */
  askedPiece: PawnPiece | null
  newPlayerId: PlayerId
  nickname: Nickname
  now: number
  room: Room
  sessionId: SessionId
}): Result<Participant, JoinError> => {
  touch(room, now)

  const existing = [...room.players.values()].find(
    (participant) => participant.sessionId === sessionId
  )

  if (existing !== undefined) {
    existing.disconnectedAt = null
    existing.isConnected = true

    return Result.success(existing)
  }

  if (room.settings.teams.kind === 'aloud') {
    return Result.failure('room_plays_aloud')
  }

  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    return Result.failure('room_full')
  }

  if (isNicknameTaken({ nickname, room, sessionId })) {
    return Result.failure('nickname_taken')
  }

  const piece = pawnPieceForArrival({
    asked: askedPiece,
    heldByOthers: [...room.players.values()]
  })
  const participant: Participant = {
    bankedCase: 0,
    colour: piece.colour,
    disconnectedAt: null,
    head: piece.head,
    id: newPlayerId,
    isConnected: true,
    isReady: false,
    nickname,
    score: 0,
    sessionId,
    teamId: null
  }

  room.players.set(participant.id, participant)

  return Result.success(participant)
}

/**
 * A seat renaming itself, which is not a join: nothing is created and a full
 * room has no bearing on it. Only the clash still applies, and it excludes this
 * seat's own session the same way a returning player's does.
 */
export const renameSeat = ({
  nickname,
  now,
  participant,
  room
}: {
  nickname: Nickname
  now: number
  participant: Participant
  room: Room
}): Result<Participant, 'nickname_taken'> => {
  touch(room, now)

  if (isNicknameTaken({ nickname, room, sessionId: participant.sessionId })) {
    return Result.failure('nickname_taken')
  }

  participant.nickname = nickname

  return Result.success(participant)
}

/**
 * A seat changing its piece: refused while a round is in play, when a pawn
 * changing looks loses the room the track, and for a piece another seat holds.
 */
export const recolourSeat = ({
  now,
  participant,
  piece,
  room
}: {
  now: number
  participant: Participant
  piece: PawnPiece
  room: Room
}): Result<Participant, 'colour_taken' | 'wrong_phase'> => {
  if (isRoundInPlay(room.phase)) {
    return Result.failure('wrong_phase')
  }

  const heldByOthers = [...room.players.values()].filter(
    (other) => other !== participant
  )

  if (!isPawnPieceFree({ heldByOthers, piece })) {
    return Result.failure('colour_taken')
  }

  participant.colour = piece.colour
  participant.head = piece.head
  touch(room, now)

  return Result.success(participant)
}

/**
 * How long the room stays the previous console's after its socket dies. A lid
 * closing, a Wi-Fi handover and a reload all land well inside it, and the screen
 * that comes back is the one that was already hosting.
 *
 * It runs out rather than holding, because the console that is never coming back
 * is the same shape as the one blinking: a minute of a refusal is an evening
 * saved, where a room nobody can pick up is the party over. What the token
 * changes is that neither is final — the screen that holds it takes the room
 * back whatever happened while it was gone.
 */
export const HOST_RECLAIM_GRACE_MS = 60 * 1_000

/**
 * `isHostConnected` comes from the messaging layer: a room whose host closed
 * their laptop still carries their `hostSessionId`, and the difference between
 * "the host is reloading" and "a second screen is trying to take over" is
 * whether a socket is currently attached.
 */
const refuseHostClaim = ({
  hostToken,
  isHostConnected,
  now,
  room,
  sessionId
}: {
  hostToken: HostToken | null
  isHostConnected: boolean
  now: number
  room: Room
  sessionId: SessionId
}): HostClaimError | null => {
  if (
    hostToken === room.hostToken ||
    room.hostSessionId === null ||
    room.hostSessionId === sessionId
  ) {
    return null
  }

  if (isHostConnected) {
    return 'host_already_connected'
  }

  return room.hostLeftAt !== null &&
    now - room.hostLeftAt < HOST_RECLAIM_GRACE_MS
    ? 'host_reconnecting'
    : null
}

export const claimHost = ({
  hostToken,
  isHostConnected,
  now,
  room,
  sessionId
}: {
  /** Replayed from the claiming screen's storage; `null` when it holds none. */
  hostToken: HostToken | null
  isHostConnected: boolean
  now: number
  room: Room
  sessionId: SessionId
}): Result<void, HostClaimError> => {
  touch(room, now)

  const refusal = refuseHostClaim({
    hostToken,
    isHostConnected,
    now,
    room,
    sessionId
  })

  if (refusal !== null) {
    return Result.failure(refusal)
  }

  room.hostSessionId = sessionId
  room.hostLeftAt = null

  return Result.success()
}

/**
 * Stamped when the room's last console goes, so the grace window is measured
 * from the moment it actually lost its host rather than from the last frame that
 * console happened to send.
 */
export const markHostAway = (room: Room, now: number): void => {
  room.hostLeftAt = now
}

export const markPlayerDisconnected = (
  room: Room,
  playerId: PlayerId,
  now: number
): void => {
  const participant = room.players.get(playerId)

  if (participant !== undefined) {
    participant.disconnectedAt = now
    participant.isConnected = false
  }

  touch(room, now)
}

export const removePlayer = (
  room: Room,
  playerId: PlayerId,
  now: number
): void => {
  room.players.delete(playerId)
  room.round?.lockedOutPlayerIds.delete(playerId)
  touch(room, now)
}

/**
 * Gives up the seats nobody has been behind for long enough that they are not
 * coming back. A greyed row costs nothing for a minute; a game runs half an
 * hour, and a player whose screen died in the first round should not be on the
 * scoreboard at the end of it.
 *
 * Returns who went, because the caller has to release whatever they were
 * holding — the floor, most of all — before it broadcasts.
 */
export const releaseAbandonedSeats = (room: Room, now: number): PlayerId[] => {
  const released = [...room.players.values()]
    .filter((participant) => isAbandoned(participant, now))
    .map((participant) => participant.id)

  for (const playerId of released) {
    removePlayer(room, playerId, now)
  }

  return released
}

/**
 * A seat back at the table, or no longer. Refused while a round is under way,
 * where it would mean nothing: the round opening is what cleared it, and the
 * next reveal is when it is asked again. A press landing in the countdown
 * crossed that opening on the wire — often the very round it armed — and is
 * dropped without a word rather than told it came too late, as is one in a
 * room whose host alone opens the next round, sent by a screen that drew the
 * press before the setting reached it.
 */
export const markReady = ({
  isReady,
  now,
  participant,
  room
}: {
  isReady: boolean
  now: number
  participant: Participant
  room: Room
}): Result<void, 'wrong_phase'> => {
  if (room.phase === 'countdown' || room.settings.hostOpensNextRound) {
    return Result.success()
  }

  if (isRoundInPlay(room.phase)) {
    return Result.failure('wrong_phase')
  }

  participant.isReady = isReady
  touch(room, now)

  return Result.success()
}

/**
 * Writes the settings a host sent, with the running order dealt over them
 * (`dealtOrder`). The round about to open is settled in the lobby, and on a
 * reveal once the console has drawn it off the entry just played.
 *
 * A host taking the next round to themselves clears every seat's ready, so no
 * mark stays up saying a seat is waited on, and the hold a whole table armed
 * goes back to the setting's (`settleReadyHold`).
 */
export const updateSettings = (
  room: Room,
  settings: RoomSettings,
  now: number
): void => {
  const { lineUp, lineUpAt, lineUpDeals, runningOrder } = settings
  const isNextSettled =
    room.phase === 'lobby' ||
    (room.phase === 'revealed' && room.round?.lineUpAt !== lineUpAt)

  room.decks = decksFollowingLineUp({
    decks: room.decks,
    from: room.settings.lineUp,
    to: lineUp
  })
  room.settings = {
    ...settings,
    lineUpDeals: dealsOf({ deals: lineUpDeals, lineUp }),
    runningOrder: dealtOrder({
      deals: lineUpDeals,
      drawnAt: isNextSettled ? lineUpAt : null,
      lineUp,
      order: runningOrder,
      played: playedPerEntry({ lineUp, opened: room.openedEntries }),
      random: randomUnit,
      upcoming: room.round?.index ?? 0
    })
  }

  if (settings.hostOpensNextRound) {
    for (const seat of room.players.values()) {
      seat.isReady = false
    }
  }

  touch(room, now)
}

const isNicknameTaken = ({
  nickname,
  room,
  sessionId
}: {
  nickname: Nickname
  room: Room
  sessionId: SessionId
}): boolean =>
  [...room.players.values()].some(
    (participant) =>
      participant.sessionId !== sessionId &&
      participant.nickname.toLowerCase() === nickname.toLowerCase()
  )
