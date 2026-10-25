import type { RoomSettings } from '@melee/protocol/room'

import { isRoomJudgedByHost } from './game-modes'

/**
 * Whether the lobby's launch is the press that seats its host and starts: the
 * table is empty, a game is chosen, and the room lets its host play. The
 * moment anybody else sits down it is the group's launch again.
 */
export const launchesWithHostSeated = ({
  seated,
  settings
}: {
  /** How many seats the room holds. */
  seated: number
  settings: RoomSettings
}): boolean =>
  seated === 0 && settings.game !== null && !isRoomJudgedByHost(settings)
