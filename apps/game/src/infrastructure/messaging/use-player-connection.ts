import { decodeMessage } from '@melee/protocol/codec'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { PlayerRoomView } from '@melee/protocol/room'
import { playerServerMessageSchema } from '@melee/protocol/server-message'

import { playerScreenLanding } from '@/helpers/player-screen-swap'
import { noteFrame, noteRoomView } from '@/infrastructure/diagnostics'

import { useForgetErrorOnPhaseChange } from './use-forget-error-on-phase-change'
import { type RoomSocket, useRoomSocket } from './use-room-socket'
import { useRoomView } from './use-room-view'

export type PlayerConnection = RoomSocket & {
  view: PlayerRoomView | null
}

/**
 * Stays disconnected until the player has named themselves — the server rejects
 * a nameless `hello`, so opening the socket earlier would only produce an error
 * frame the join form would have to hide.
 */
export const usePlayerConnection = ({
  fadeOffTheCountdown,
  nickname,
  roomCode
}: {
  /** Lays a still copy of the countdown as drawn over the round it counts in, whose first press a swap would hold. */
  fadeOffTheCountdown: () => void
  nickname: string | null
  roomCode: RoomCode
}): PlayerConnection => {
  const [view, receiveView] = useRoomView<PlayerRoomView>({
    fadeOffWhatIsDrawn: fadeOffTheCountdown,
    landingOf: playerScreenLanding
  })

  // No `useCallback`: `useRoomSocket` holds this in an Effect Event, so its
  // identity is nothing the socket reads.
  const onFrame = (raw: string): void => {
    const decoded = decodeMessage(playerServerMessageSchema, raw)

    if (decoded.status === 'failure') {
      return
    }

    noteFrame({ direction: 'in', type: decoded.message.type })

    if ('view' in decoded.message) {
      const { view } = decoded.message

      noteRoomView({
        game: view.settings.game?.kind ?? null,
        isSpeaker: false,
        phase: view.phase,
        role: 'player',
        roomCode,
        roundIndex: view.round?.index ?? null
      })
      receiveView(view)
    }
  }

  const socket = useRoomSocket({
    enabled: nickname !== null,
    nickname,
    onFrame,
    role: 'player',
    roomCode
  })

  useForgetErrorOnPhaseChange({ clearError: socket.clearError, view })

  return { ...socket, view }
}
