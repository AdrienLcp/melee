import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { ShelvedGame } from '@melee/protocol/game'
import type { Nickname } from '@melee/protocol/identifiers'

import { createRoom } from '@/infrastructure/api/melee-api'
import {
  hostPathFor,
  playRightAwayNavigation
} from '@/infrastructure/router/navigation'
import { writeStoredNickname } from '@/infrastructure/storage/preferences-storage'
import {
  writeHostToken,
  writeSeatNickname
} from '@/infrastructure/storage/session-storage'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import {
  apiErrorKey,
  type PlainTranslationKey
} from '@/presentation/i18n/translation'

import { isRoomPresetId, ROOM_PRESETS, type RoomPresetId } from './room-presets'

/**
 * Which door a room is being opened through. `null` is the shelf's own — a room
 * with nothing chosen yet — and it is a value rather than an absence: the page
 * draws that door beside the games' and the evenings', and has to tell which
 * one is working.
 */
export type RoomDoor = ShelvedGame | RoomPresetId | null

type RoomOpening =
  | { door: RoomDoor; error: PlainTranslationKey; status: 'refused' }
  | { door: RoomDoor; seatAs: Nickname | null; status: 'opening' }
  | { status: 'idle' }

/**
 * The one trip to the network every front door makes, and the console it lands
 * on. The shelf's own door opens a room with nothing chosen; a game's door
 * carries which, because a host who came through it has already answered the
 * question the lobby would ask.
 *
 * It is one state and not a boolean beside an error, because the page now has
 * six doors sharing this hook and a spinner has to appear on the one that was
 * pressed. That is also what closes the second press: a door already opening a
 * room refuses to open another, and `isOpeningAny` is what greys the other
 * doors out so they stop looking pressable while it does.
 */
export const useCreateRoom = () => {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const [opening, setOpening] = useState<RoomOpening>({ status: 'idle' })

  return {
    /** The door's own *open a table* is on its way, rather than its *play right away*. */
    isOpening: (door: RoomDoor): boolean =>
      opening.status === 'opening' &&
      opening.door === door &&
      opening.seatAs === null,
    isOpeningAny: opening.status === 'opening',
    isStartingRightAway: (door: RoomDoor): boolean =>
      opening.status === 'opening' &&
      opening.door === door &&
      opening.seatAs !== null,
    /**
     * Opens the room for `door`. With `seatAs`, the console it lands on takes
     * the host's seat under that name and starts the first round itself: the
     * seat is written where the console's `hello` reads it, and the start rides
     * the navigation, which the console consumes once.
     */
    open: async (
      door: RoomDoor,
      seatAs: Nickname | null = null
    ): Promise<void> => {
      if (opening.status === 'opening') {
        return
      }

      setOpening({ door, seatAs, status: 'opening' })

      const created = await createRoom(
        door === null
          ? { locale }
          : isRoomPresetId(door)
            ? { locale, preset: ROOM_PRESETS[door] }
            : { game: door, locale }
      )

      if (created.status === 'failure') {
        setOpening(
          created.error === 'aborted'
            ? { status: 'idle' }
            : { door, error: apiErrorKey(created.error), status: 'refused' }
        )

        return
      }

      writeHostToken({
        hostToken: created.data.hostToken,
        roomCode: created.data.code
      })

      if (seatAs === null) {
        await navigate(hostPathFor(created.data.code))

        return
      }

      writeStoredNickname(seatAs)
      writeSeatNickname({
        nickname: seatAs,
        role: 'host',
        roomCode: created.data.code
      })
      await navigate(hostPathFor(created.data.code), playRightAwayNavigation)
    },
    /**
     * The refusal and the door that met it. Every cause is the room service
     * rather than the game — a rate limit, a dead network — so the shelf draws
     * one message for its five cards and reads the door only to know it is not
     * the one above them.
     */
    refusal: opening.status === 'refused' ? opening : null
  }
}

/** What `useCreateRoom` hands a front door, for the pieces of it that press. */
export type CreateRoom = ReturnType<typeof useCreateRoom>
