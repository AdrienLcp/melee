import { decodeMessage } from '@melee/protocol/codec'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { WallRoomView } from '@melee/protocol/room'
import { wallServerMessageSchema } from '@melee/protocol/server-message'

import { wallStageLanding } from '@/helpers/stage-replacement'

import { type RoomSocket, useRoomSocket } from './use-room-socket'
import { useRoomView } from './use-room-view'

export type WallConnection = RoomSocket & {
  view: WallRoomView | null
}

/**
 * The room's own screen. It sends its hello, its clock and what it hears of
 * the clip when it is the speaker, and the token it carries in that hello is
 * the whole of what lets it in.
 */
export const useWallConnection = (roomCode: RoomCode): WallConnection => {
  const [view, receiveView] = useRoomView<WallRoomView>({
    landingOf: wallStageLanding
  })

  const onFrame = (raw: string): void => {
    const decoded = decodeMessage(wallServerMessageSchema, raw)

    if (decoded.status === 'success' && 'view' in decoded.message) {
      receiveView(decoded.message.view)
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
