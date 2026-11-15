import type { RoundId } from '@melee/protocol/identifiers'

import type { Room } from '@/domain/room/room'
import {
  earliestDeadline,
  type RoomDeadline,
  roomDeadlines
} from '@/domain/room/room-deadlines'
import { settleReadyHold } from '@/domain/round/round-service'
import {
  liveRoomFactsOf,
  liveRoomRowToWrite,
  type WrittenLiveRoom
} from '@/infrastructure/reports/live-room-row'
import { keepLiveRoom } from '@/infrastructure/reports/server-reports'

import type { Connection } from './connection'
import { broadcastRoom } from './outbound'
import { electSpeakerWall, isHostConnected, wallsOf } from './room-connections'

/**
 * What a room needs from the process keeping it. Nothing here is global: two
 * rooms sharing a process — or a runtime evicting one and keeping the other —
 * must never see each other's sockets, clock or deadlines.
 */
export type RoomPorts = {
  /**
   * Work the room starts and never waits for — its row in `rooms_live`. The
   * Durable Object hands it to `waitUntil`, so a slow database never holds a
   * frame back.
   */
  background: (task: Promise<void>) => void
  connections: {
    add: (connection: Connection) => void
    all: () => Connection[]
    remove: (connection: Connection) => void
  }
  /** The room is over: whatever holds it lets it go, and its code stops resolving. */
  discard: () => void
  now: () => number
  /** Called after every accepted change, with the whole room — rule 3 applies to storage too. */
  persist: (room: Room) => void
  /** One wake at a time, replacing the last; `null` cancels it. */
  wakeAt: (at: number | null) => void
}

export type RoomEngine = RoomPorts & {
  /**
   * The round whose clip has already been replaced once. A replacement that
   * would not load either is said to the console rather than replaced again.
   */
  clipReplacedOn: RoundId | null
  isClosed: boolean
  /** Not persisted: a draw is an `await` in flight, and nothing outlives one. */
  isDrawing: boolean
  /** Not persisted: an object woken from hibernation writes its row once more, which is cheap. */
  liveRoomWritten: WrittenLiveRoom | null
  room: Room
}

export const createRoomEngine = (room: Room, ports: RoomPorts): RoomEngine => ({
  ...ports,
  clipReplacedOn: null,
  isClosed: false,
  isDrawing: false,
  liveRoomWritten: null,
  room
})

const liveRoomFactsOfEngine = (engine: RoomEngine) =>
  liveRoomFactsOf({ room: engine.room, wallCount: wallsOf(engine).length })

const noteLiveRoom = (engine: RoomEngine): void => {
  const now = engine.now()
  const facts = liveRoomFactsOfEngine(engine)
  const row = liveRoomRowToWrite({
    facts,
    last: engine.liveRoomWritten,
    now,
    room: engine.room
  })

  if (row === null) {
    return
  }

  engine.liveRoomWritten = { at: now, facts }
  engine.background(keepLiveRoom(row))
}

export const deadlinesOf = (engine: RoomEngine): RoomDeadline[] =>
  roomDeadlines({
    hasConnections: engine.connections.all().length > 0,
    isDrawing: engine.isDrawing,
    isHostConnected: isHostConnected(engine),
    now: engine.now(),
    room: engine.room
  })

export const commitRoom = (engine: RoomEngine): void => {
  if (engine.isClosed) {
    return
  }

  engine.persist(engine.room)
  engine.wakeAt(earliestDeadline(deadlinesOf(engine))?.at ?? null)
  noteLiveRoom(engine)
}

/**
 * Where every state change ends: the room is kept, then each socket is sent its
 * view. In that order because a Durable Object holds a frame back only behind a
 * write already issued — sent first, a view could reach a screen and the room
 * be evicted before storing it, coming back older than what every screen shows.
 * Every change passes here, a wall leaving included, which is what makes it the
 * place a departed speaker is replaced — before the commit, which writes who
 * speaks onto each wall's socket.
 */
export const publishRoom = (engine: RoomEngine): void => {
  settleReadyHold(engine.room, engine.now())
  electSpeakerWall(engine)
  commitRoom(engine)
  broadcastRoom(engine)
}

export const closeRoomEngine = (engine: RoomEngine): void => {
  const now = engine.now()

  engine.isClosed = true
  engine.wakeAt(null)
  engine.background(
    keepLiveRoom({
      ...liveRoomFactsOfEngine(engine),
      closedAt: now,
      code: engine.room.code,
      openedAt: engine.room.createdAt,
      updatedAt: now
    })
  )
  engine.discard()
}
