import { encodeChecked } from '@melee/protocol/codec'
import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { SessionId } from '@melee/protocol/identifiers'
import {
  hostServerMessageSchema,
  playerServerMessageSchema,
  protocolErrorMessageSchema,
  timePongMessageSchema,
  wallServerMessageSchema
} from '@melee/protocol/server-message'
import { PROTOCOL_VERSION } from '@melee/protocol/version'

import type { Room } from '@/domain/room/room'
import { toHostView, toPlayerView, toWallView } from '@/domain/room/room-view'

import type { Connection, Outbound } from './connection'
import {
  electSpeakerWall,
  isHostConnected,
  wallCountOf
} from './room-connections'
import type { RoomEngine } from './room-engine'

export const sendError = (
  outbound: Outbound,
  {
    code,
    fatal,
    message
  }: { code: ProtocolErrorCode; fatal: boolean; message: string }
): void => {
  outbound.send(
    encodeChecked(protocolErrorMessageSchema, {
      code,
      fatal,
      message,
      type: 'error'
    })
  )
}

export const sendPong = (
  outbound: Outbound,
  { clientSentAt, serverTime }: { clientSentAt: number; serverTime: number }
): void => {
  outbound.send(
    encodeChecked(timePongMessageSchema, {
      clientSentAt,
      serverTime,
      type: 'time.pong'
    })
  )
}

/**
 * The one place a connection's role picks its view, for the welcome and every
 * update alike. Encoding runs through the role's own schema, so a field that
 * reached the wrong projection by mistake is stripped before it leaves the
 * process rather than shipped — see `encodeChecked`.
 */
const encodeViewFor = (
  connection: Connection,
  {
    envelope,
    isHostThere,
    now,
    room,
    wallCount
  }: {
    envelope:
      | {
          protocolVersion: number
          serverTime: number
          sessionId: SessionId
          type: 'welcome'
        }
      | { type: 'room.updated' }
    isHostThere: boolean
    now: number
    room: Room
    wallCount: number
  }
): string => {
  const isWallThere = wallCount > 0

  switch (connection.role) {
    case 'host': {
      return encodeChecked(hostServerMessageSchema, {
        ...envelope,
        view: toHostView({
          isHostConnected: isHostThere,
          now,
          room,
          seatId: connection.playerId,
          wallCount
        })
      })
    }

    case 'player': {
      return encodeChecked(playerServerMessageSchema, {
        ...envelope,
        view: toPlayerView({
          isHostConnected: isHostThere,
          isWallConnected: isWallThere,
          now,
          room,
          youId: connection.playerId
        })
      })
    }

    case 'wall': {
      return encodeChecked(wallServerMessageSchema, {
        ...envelope,
        view: toWallView({
          isHostConnected: isHostThere,
          isSpeaker: connection.isSpeaker,
          now,
          room
        })
      })
    }
  }
}

export const sendWelcome = (
  connection: Connection,
  { engine, sessionId }: { engine: RoomEngine; sessionId: SessionId }
): void => {
  const now = engine.now()

  electSpeakerWall(engine)
  connection.send(
    encodeViewFor(connection, {
      envelope: {
        protocolVersion: PROTOCOL_VERSION,
        serverTime: now,
        sessionId,
        type: 'welcome'
      },
      isHostThere: isHostConnected(engine),
      now,
      room: engine.room,
      wallCount: wallCountOf(engine)
    })
  )
}

/**
 * Each socket receives its whole role-scoped view, never a delta. Every change
 * passes here, a wall leaving included, which is what makes it the place a
 * departed speaker is replaced.
 */
export const broadcastRoom = (engine: RoomEngine): void => {
  electSpeakerWall(engine)

  const isHostThere = isHostConnected(engine)
  const wallCount = wallCountOf(engine)
  const now = engine.now()

  for (const connection of engine.connections.all()) {
    connection.send(
      encodeViewFor(connection, {
        envelope: { type: 'room.updated' },
        isHostThere,
        now,
        room: engine.room,
        wallCount
      })
    )
  }
}
