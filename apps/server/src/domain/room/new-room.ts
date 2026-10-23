import type { GameKind } from '@melee/protocol/game'
import type { HostToken, RoomCode } from '@melee/protocol/identifiers'
import type { Locale } from '@melee/protocol/locale'

import { roomSettingsFor } from '@melee/core/room/room-settings'

import type { Room } from './room'
import { fitTeamsToSettings } from './team-service'

/**
 * The code is the caller's because uniqueness is: the process that keeps the
 * rooms is the only one that can tell a code is free.
 */
export const newRoom = ({
  code,
  games,
  hostToken,
  locale,
  now
}: {
  code: RoomCode
  /** Empty from the front door, where the code goes up before anybody has decided. */
  games: readonly GameKind[]
  hostToken: HostToken
  /** The host's, so a quiz opens in a language they read rather than in a fixed one. */
  locale: Locale
  now: number
}): Room => {
  const room: Room = {
    code,
    createdAt: now,
    duelsBySeat: new Map(),
    hostLeftAt: null,
    hostSessionId: null,
    hostToken,
    isDuelAsked: false,
    lastActivityAt: now,
    phase: 'lobby',
    playedContentIds: new Set(),
    players: new Map(),
    round: null,
    settings: roomSettingsFor({ games, locale }),
    teams: [],
    trackPool: []
  }

  fitTeamsToSettings(room)

  return room
}
