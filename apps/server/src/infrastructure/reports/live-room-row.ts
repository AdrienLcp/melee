import type { AdminLiveRoom } from '@melee/protocol/admin'

import type { Room } from '@/domain/room/room'

/**
 * How often a room that changes nothing `/admin` lists still rewrites its row,
 * so a game played on one screen for an hour reads as alive, not as stale.
 */
export const LIVE_ROOM_TOUCH_MS = 5 * 60_000

/** What `/admin` shows of a room. A seat is counted, never named. */
export type LiveRoomFacts = Pick<
  AdminLiveRoom,
  'game' | 'phase' | 'roundIndex' | 'seatCount' | 'wallCount'
>

/** The last row a room wrote, held by its engine for as long as the process keeps it. */
export type WrittenLiveRoom = { at: number; facts: LiveRoomFacts }

export const liveRoomFactsOf = ({
  room,
  wallCount
}: {
  room: Room
  wallCount: number
}): LiveRoomFacts => ({
  game: room.settings.game?.kind ?? null,
  phase: room.phase,
  roundIndex: room.round?.index ?? null,
  seatCount: room.players.size,
  wallCount
})

const isSameFacts = (first: LiveRoomFacts, second: LiveRoomFacts): boolean =>
  first.game === second.game &&
  first.phase === second.phase &&
  first.roundIndex === second.roundIndex &&
  first.seatCount === second.seatCount &&
  first.wallCount === second.wallCount

/**
 * The row to write, or `null` when the last one still says it all. A room
 * commits on every frame that changes it — a guess, a vote, a ready press —
 * and only a change `/admin` shows, or the touch falling due, costs a write.
 */
export const liveRoomRowToWrite = ({
  facts,
  last,
  now,
  room
}: {
  facts: LiveRoomFacts
  last: WrittenLiveRoom | null
  now: number
  room: Room
}): AdminLiveRoom | null =>
  last !== null &&
  isSameFacts(last.facts, facts) &&
  now - last.at < LIVE_ROOM_TOUCH_MS
    ? null
    : {
        ...facts,
        closedAt: null,
        code: room.code,
        openedAt: room.createdAt,
        updatedAt: now
      }
