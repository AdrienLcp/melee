import type { GameKind } from '@melee/protocol/game'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { Locale } from '@melee/protocol/locale'

import { generateRoomCode } from '@melee/core/room/room-code'

import { newRoom } from '@/domain/room/new-room'
import type { Room } from '@/domain/room/room'
import { nowMs } from '@/infrastructure/clock'
import type { RoomDoor } from '@/infrastructure/http/http-ports'
import { newHostToken } from '@/infrastructure/ids'
import { logger } from '@/infrastructure/logging/logger'
import type { Connection } from '@/infrastructure/messaging/connection'
import {
  commitRoom,
  createRoomEngine,
  type RoomEngine
} from '@/infrastructure/messaging/room-engine'
import { wakeRoom } from '@/infrastructure/messaging/round-conductor'

/**
 * Every room this process holds, in memory and nowhere else: a restart or a
 * deploy ends every party in progress. It is the one process-wide table left,
 * and it lives until rooms move to an object of their own each.
 */
const engines = new Map<RoomCode, RoomEngine>()

const MAX_CODE_ATTEMPTS = 20

export const findRoomEngine = (code: RoomCode): RoomEngine | null =>
  engines.get(code) ?? null

export const openRoomInProcess = ({
  games,
  locale
}: {
  games: readonly GameKind[]
  locale: Locale
}): RoomEngine | null => {
  const code = drawUnusedCode()

  if (code === null) {
    return null
  }

  const engine = engineFor(
    newRoom({
      code,
      games,
      hostToken: newHostToken(),
      locale,
      now: nowMs()
    })
  )

  engines.set(code, engine)
  commitRoom(engine)

  return engine
}

/** Exported for the restore test: a room rebuilt from a snapshot, with nothing else surviving. */
export const engineFor = (room: Room): RoomEngine => {
  const connections = new Set<Connection>()
  let wake: ReturnType<typeof setTimeout> | null = null

  const engine: RoomEngine = createRoomEngine(room, {
    connections: {
      add: (connection) => {
        connections.add(connection)
      },
      all: () => [...connections],
      remove: (connection) => {
        connections.delete(connection)
      }
    },
    discard: () => {
      if (engines.get(room.code) === engine) {
        engines.delete(room.code)
      }
    },
    now: nowMs,
    // Cloned as the Durable Object's storage clones it, so a room the Worker
    // could not store fails here too.
    persist: (current) => {
      structuredClone(current)
    },
    wakeAt: (at) => {
      if (wake !== null) {
        clearTimeout(wake)
        wake = null
      }

      if (at === null) {
        return
      }

      wake = setTimeout(
        () => {
          wake = null
          void wakeRoom(engine)
        },
        Math.max(0, at - nowMs())
      )

      wake.unref()
    }
  })

  return engine
}

/**
 * 28^4 codes against a handful of live rooms, so a collision is a curiosity
 * rather than a risk — but a silent overwrite would drop a game in progress,
 * and retrying costs nothing.
 */
const drawUnusedCode = (): RoomCode | null => {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateRoomCode()

    if (!engines.has(code)) {
      return code
    }
  }

  logger.error('Exhausted room code attempts', { liveRooms: engines.size })

  return null
}

export const inProcessRoomDoor: RoomDoor = {
  isHostedWith: async ({ code, hostToken }) =>
    findRoomEngine(code)?.room.hostToken === hostToken,
  openRoom: async (input) => {
    const engine = openRoomInProcess(input)

    return engine === null
      ? null
      : { code: engine.room.code, hostToken: engine.room.hostToken }
  },
  roomExists: async (code) => findRoomEngine(code) !== null
}
