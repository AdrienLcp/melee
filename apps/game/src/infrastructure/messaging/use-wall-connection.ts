import { decodeMessage } from '@melee/protocol/codec'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { WallRoomView } from '@melee/protocol/room'
import {
  type WallServerMessage,
  wallServerMessageSchema
} from '@melee/protocol/server-message'

import { wallStageLanding } from '@/helpers/stage-replacement'
import { noteFrame, noteRoomView } from '@/infrastructure/diagnostics'

import { type RoomSocket, useRoomSocket } from './use-room-socket'
import { useRoomView } from './use-room-view'

export type WallConnection = RoomSocket & {
  view: WallRoomView | null
}

/** The two frames that are not a view: a sample to play now, and its stop. */
export type WallSoundTest = Extract<
  WallServerMessage,
  { type: 'wall.stopSoundTest' | 'wall.testSound' }
>

/**
 * The room's own screen. It sends its hello, its clock and what it hears of
 * the clip when it is the speaker, and the token it carries in that hello is
 * the whole of what lets it in.
 */
export const useWallConnection = ({
  onSoundTest,
  roomCode
}: {
  /** Called as the frame lands, which is no press: see `armSoundCheck`. */
  onSoundTest: (frame: WallSoundTest) => void
  roomCode: RoomCode
}): WallConnection => {
  const [view, receiveView] = useRoomView<WallRoomView>({
    landingOf: wallStageLanding
  })

  const onFrame = (raw: string): void => {
    const decoded = decodeMessage(wallServerMessageSchema, raw)

    if (decoded.status === 'failure') {
      return
    }

    noteFrame({ direction: 'in', type: decoded.message.type })

    if (
      decoded.message.type === 'wall.testSound' ||
      decoded.message.type === 'wall.stopSoundTest'
    ) {
      onSoundTest(decoded.message)

      return
    }

    if ('view' in decoded.message) {
      const { view } = decoded.message

      noteRoomView({
        game: view.settings.game?.kind ?? null,
        isSpeaker: view.isSpeaker,
        phase: view.phase,
        role: 'wall',
        roomCode,
        roundIndex: view.round?.index ?? null
      })
      receiveView(view)
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
