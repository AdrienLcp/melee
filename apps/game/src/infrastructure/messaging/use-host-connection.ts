import { useState } from 'react'

import { decodeMessage } from '@melee/protocol/codec'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { HostRoomView } from '@melee/protocol/room'
import { hostServerMessageSchema } from '@melee/protocol/server-message'

import { useForgetErrorOnPhaseChange } from './use-forget-error-on-phase-change'
import { type RoomSocket, useRoomSocket } from './use-room-socket'

export type HostConnection = RoomSocket & {
  view: HostRoomView | null
}

/**
 * A nickname takes a seat as well as the room: the same socket carries both,
 * which is what lets the server withhold the answer from a host who is playing.
 * It is part of the connection rather than a later message because the seat has
 * to survive a reconnect the same way a player's does.
 */
export const useHostConnection = (
  roomCode: RoomCode,
  nickname: string | null
): HostConnection => {
  const [view, setView] = useState<HostRoomView | null>(null)

  // No `useCallback`: `useRoomSocket` holds this in an Effect Event, so its
  // identity is nothing the socket reads.
  const onFrame = (raw: string): void => {
    const decoded = decodeMessage(hostServerMessageSchema, raw)

    if (decoded.status === 'success' && 'view' in decoded.message) {
      setView(decoded.message.view)
    }
  }

  const socket = useRoomSocket({
    enabled: true,
    nickname,
    onFrame,
    role: 'host',
    roomCode
  })

  useForgetErrorOnPhaseChange({ clearError: socket.clearError, view })

  return { ...socket, view }
}
