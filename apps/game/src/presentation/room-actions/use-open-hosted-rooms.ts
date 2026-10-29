import { useEffect, useState } from 'react'

import type { RoomCode } from '@melee/protocol/identifiers'

import { roomExists } from '@/infrastructure/api/melee-api'
import {
  forgetRoom,
  readHostedRoomCodes
} from '@/infrastructure/storage/session-storage'

/**
 * Every room whose console this device can reopen and which is still open,
 * newest first, or `null` while the server is being asked. The token lasts a day
 * and a room can be gone in an hour, so every remembered code is asked at
 * once and nothing is offered before the answers land — a door put up early
 * would be an offer withdrawn.
 *
 * **A lookup that fails is not a refusal.** Only `exists: false` says a room has
 * gone; a request that never landed says nothing, and withholding the door then
 * is the failure it exists to fix — the console's own refusal screen says so if
 * the room turns out to be dead. Only a confirmed absence prunes the store.
 */
export const useOpenHostedRooms = (): RoomCode[] | null => {
  const [hosted] = useState(readHostedRoomCodes)
  const [stillOpen, setStillOpen] = useState<RoomCode[] | null>(
    hosted.length === 0 ? [] : null
  )

  useEffect(() => {
    if (hosted.length === 0) {
      return
    }

    const controller = new AbortController()

    const resolveEach = async (): Promise<void> => {
      const answers = await Promise.all(
        hosted.map(async (roomCode) => ({
          found: await roomExists({
            code: roomCode,
            signal: controller.signal
          }),
          roomCode
        }))
      )

      // An answer that landed before the abort still prunes the store, which
      // outlives this screen.
      for (const { found, roomCode } of answers) {
        if (found.status === 'success' && !found.data) {
          forgetRoom(roomCode)
        }
      }

      if (!controller.signal.aborted) {
        setStillOpen(
          answers
            .filter(({ found }) => found.status === 'failure' || found.data)
            .map(({ roomCode }) => roomCode)
        )
      }
    }

    void resolveEach()

    return () => {
      controller.abort()
    }
  }, [hosted])

  return stillOpen
}
