import { useState } from 'react'

import { decodeMessage } from '@melee/protocol/codec'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { WallRoomView } from '@melee/protocol/room'
import { wallServerMessageSchema } from '@melee/protocol/server-message'

import { type RoomSocket, useRoomSocket } from './use-room-socket'

export type WallConnection = RoomSocket & {
  view: WallRoomView | null
}

/**
 * The room's own screen. It sends nothing but its hello and its clock, and the
 * token it carries in that hello is the whole of what lets it in.
 */
export const useWallConnection = (roomCode: RoomCode): WallConnection => {
  const [view, setView] = useState<WallRoomView | null>(null)

  const onFrame = (raw: string): void => {
    const decoded = decodeMessage(wallServerMessageSchema, raw)

    if (decoded.status === 'success' && 'view' in decoded.message) {
      setView(decoded.message.view)
    }
  }

  const socket = useRoomSocket({
    enabled: true,
    nickname: null,
    onFrame,
    role: 'wall',
    roomCode
  })

  return { ...socket, view }
}
