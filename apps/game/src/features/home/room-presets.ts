import type { BoardSettings } from '@melee/protocol/board'
import type { ShelvedGame } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'
import type { TeamsSettings } from '@melee/protocol/team'

type RoomPreset = {
  board: BoardSettings
  lineUp: readonly ShelvedGame[]
  roundCount: RoomSettings['roundCount']
  teams: TeamsSettings
}

/** The evenings the shelf offers ready-made, in the order it draws them. */
export const roomPresetIds = ['teamNight'] as const

export type RoomPresetId = (typeof roomPresetIds)[number]

/**
 * What each evening opens a room on. The name and the pitch are the
 * dictionary's; the room is only ever sent the settings, and holds nothing
 * that says a preset opened it.
 *
 * The company raclette this was built for: about twelve people, so three teams
 * of four, and four rounds of each game. The board ranks rather than counts,
 * so a buzzer round a team of four wins moves its pawn, and forty cases is
 * where three teams ranked 3, 2 and 1 a round reach the finish around round
 * seventeen of twenty: the race is decided near the end, not halfway.
 */
export const ROOM_PRESETS: Record<RoomPresetId, RoomPreset> = {
  teamNight: {
    board: { catchUp: true, kind: 'track', length: 40, strategy: 'rank' },
    lineUp: ['quiz', 'blindtest', 'buzzer', 'worldmap', 'challenge'],
    roundCount: 20,
    teams: { count: 3, kind: 'drawn' }
  }
}

export const isRoomPresetId = (door: string): door is RoomPresetId =>
  roomPresetIds.some((id) => id === door)
