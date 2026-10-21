import { DEFAULT_TRACK_SETTINGS } from '@melee/protocol/board'
import type { RoomPreset } from '@melee/protocol/http'

/** The evenings the shelf offers ready-made, in the order it draws them. */
export const roomPresetIds = ['christmas'] as const

export type RoomPresetId = (typeof roomPresetIds)[number]

/**
 * What each evening opens a room on. The name and the pitch are the
 * dictionary's; the room is only ever sent the settings, and holds nothing
 * that says a preset opened it.
 *
 * The company raclette this was built for: about twelve people, so three teams
 * of four, and four rounds of each game.
 */
export const ROOM_PRESETS: Record<RoomPresetId, RoomPreset> = {
  christmas: {
    board: DEFAULT_TRACK_SETTINGS,
    lineUp: ['quiz', 'blindtest', 'buzzer', 'worldmap', 'challenge'],
    roundCount: 20,
    teams: { count: 3, kind: 'drawn' }
  }
}

export const isRoomPresetId = (door: string): door is RoomPresetId =>
  roomPresetIds.some((id) => id === door)
