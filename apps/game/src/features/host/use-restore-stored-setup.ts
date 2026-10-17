import { useEffect, useRef } from 'react'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'

import {
  type HostPreferences,
  restoredSettings
} from '@melee/core/room/host-preferences'
import { settingsToPlayRightAway } from '@melee/core/room/play-right-away'

/**
 * A room is created by the server, on the server's defaults, so what this host
 * last set is applied from here — one frame, in the lobby, and never again for
 * this room.
 *
 * Only the *first* view counts, whatever phase it arrives in. A console that
 * reloaded mid-game must not re-apply anything: the server would refuse the
 * three settings a round is built on, and the rest would be somebody's evening
 * rearranged under them between two rounds.
 *
 * A console opened to play right away restores the same setup minus a way of
 * answering that would make its host the judge, because the seat it was opened
 * for would be refused under it.
 */
export const useRestoreStoredSetup = ({
  onRestore,
  playsRightAway,
  preferences,
  view
}: {
  /** Must be stable — it is an effect's dependency. */
  onRestore: (settings: RoomSettings) => void
  /** The console was opened to seat its host and start at once. */
  playsRightAway: boolean
  preferences: HostPreferences | null
  view: HostRoomView | null
}): void => {
  const hasSeenRoom = useRef(false)

  useEffect(() => {
    if (view === null || hasSeenRoom.current) {
      return
    }

    hasSeenRoom.current = true

    if (view.phase !== 'lobby' || preferences === null) {
      return
    }

    onRestore(
      playsRightAway
        ? settingsToPlayRightAway({ preferences, settings: view.settings })
        : restoredSettings({ preferences, settings: view.settings })
    )
  }, [onRestore, playsRightAway, preferences, view])
}
