import type { RoundDuel } from '@melee/protocol/room'

import { canPlayDuel as canGamePlayDuel } from '@melee/core/team/duel'
import { drawDuel } from '@melee/core/team/duel-draw'

import type { Room } from '@/domain/room/room'
import { seatsOf } from '@/domain/room/team-service'

/**
 * Whether the round about to open could be a duel. Asked before the seats
 * still without a team are placed, so it reads the teams the room keeps rather
 * than who already sits in them; `takeDuel` finds out once they are placed.
 */
export const canPlayDuel = (room: Room): boolean =>
  room.settings.teams.kind !== 'aloud' &&
  canGamePlayDuel({
    game: room.settings.game?.kind ?? null,
    mode: room.settings.mode.kind,
    teamCount: room.teams.length
  })

/**
 * The duel the round about to open is, when the host asked for one and the
 * room can still play it — two seats drawn and counted — and `null` when
 * everyone plays it. The wish is spent either way: a duel is asked for one
 * round at a time.
 */
export const takeDuel = (room: Room): RoundDuel | null => {
  const isAsked = room.isDuelAsked

  room.isDuelAsked = false

  if (!isAsked || !canPlayDuel(room)) {
    return null
  }

  const duel = drawDuel({
    duelsBySeat: room.duelsBySeat,
    teams: room.teams.map((team) => ({
      id: team.id,
      seatIds: seatsOf(room, team.id).map((participant) => participant.id)
    }))
  })

  if (duel === null) {
    return null
  }

  for (const seatId of duel.seatIds) {
    room.duelsBySeat.set(seatId, (room.duelsBySeat.get(seatId) ?? 0) + 1)
  }

  return duel
}
