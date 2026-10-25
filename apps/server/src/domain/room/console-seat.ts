import type { PlayerId } from '@melee/protocol/identifiers'

import { isJudgedByHost } from '@melee/core/room/game-modes'

import type { Room } from './room'

/** The seat the console took, found by the session that holds the room. */
export const consoleSeatId = (room: Room): PlayerId | null => {
  for (const player of room.players.values()) {
    if (player.sessionId === room.hostSessionId) {
      return player.id
    }
  }

  return null
}

/**
 * Whether the round on screen is one the console judges, read off what the
 * round was opened on rather than the settings, which may already have moved on.
 * A seated console sits such a round out: it keeps its seat and its score, and
 * plays again on the next round nobody has to judge.
 */
export const isRoundJudgedByConsole = (room: Room): boolean =>
  room.round !== null &&
  isJudgedByHost({
    game: room.round.content.kind,
    mode: room.round.mode.kind
  })

/** The seats the round on screen is played by: every one, less a console judging it. */
export const playingSeatIds = (room: Room): Set<PlayerId> => {
  const seatIds = new Set(room.players.keys())
  const sittingOut = isRoundJudgedByConsole(room) ? consoleSeatId(room) : null

  if (sittingOut !== null) {
    seatIds.delete(sittingOut)
  }

  return seatIds
}
