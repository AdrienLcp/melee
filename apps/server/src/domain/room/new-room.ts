import type { GameKind } from '@melee/protocol/game'
import type { RoomPreset } from '@melee/protocol/http'
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
  game,
  hostToken,
  locale,
  now,
  preset = null
}: {
  code: RoomCode
  /** `null` from the front door, where the code goes up before anybody has decided. */
  game: GameKind | null
  hostToken: HostToken
  /** The host's, so a quiz opens in a language they read rather than in a fixed one. */
  locale: Locale
  now: number
  /** In place of `game`, for a room opened on a whole evening. */
  preset?: RoomPreset | null
}): Room => {
  const room: Room = {
    code,
    createdAt: now,
    hostLeftAt: null,
    hostSessionId: null,
    hostToken,
    lastActivityAt: now,
    phase: 'lobby',
    playedContentIds: new Set(),
    players: new Map(),
    playsByTeam: false,
    round: null,
    set: null,
    setsPlayed: 0,
    settings: roomSettingsFor({ game, locale, preset }),
    teams: [],
    trackPool: []
  }

  fitTeamsToSettings(room)

  return room
}
