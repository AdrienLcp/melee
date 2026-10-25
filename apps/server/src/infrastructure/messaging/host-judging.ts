import type { PlayerId } from '@melee/protocol/identifiers'

import type { Room } from '@/domain/room/room'
import { removePlayer } from '@/domain/room/room-service'
import { releaseBuzz } from '@/domain/round/round-service'

import { forgetSeat } from './room-connections'
import { publishRoom, type RoomEngine } from './room-engine'

/**
 * Whether the room keeps its console off the board altogether. A single round
 * the console judges does not: its seat sits that round out and keeps its score
 * (`@/domain/room/console-seat`).
 *
 * Read where a seat is granted as well as where the rules change, because a
 * console remembers the name it was seated under and replays it on every
 * reconnect — a rule enforced only where the form is drawn is a rule the next
 * `hello` walks straight through.
 *
 * A table answering aloud is judged by its console on every round.
 */
export const hostMustJudge = (room: Room): boolean =>
  room.settings.teams.kind === 'aloud'

// Removed from the roster before the buzz is released, so that the player
// being unseated cannot be the one counted as still able to answer — and off
// the console before either, because this is what broadcasts and
// `toHostView` reads the seat off the connection.
export const unseat = (playerId: PlayerId, engine: RoomEngine): void => {
  const { room } = engine

  forgetSeat(engine, playerId)
  removePlayer(room, playerId, engine.now())
  releaseBuzz({ now: engine.now(), playerId, room })
  publishRoom(engine)
}

/**
 * A seat can outlive the reason it was allowed: a host seated before the
 * table chose to answer aloud. Run where the
 * settings change.
 *
 * Every host connection rather than the one that sent the frame — a second tab
 * of the same browser is let in on purpose, and the seat is on whichever of
 * them said hello with a name.
 */
export const unseatConsolesThatMustJudge = (engine: RoomEngine): void => {
  if (!hostMustJudge(engine.room)) {
    return
  }

  for (const connection of engine.connections.all()) {
    if (connection.role === 'host' && connection.playerId !== null) {
      unseat(connection.playerId, engine)
    }
  }
}
