import { useEffect, useEffectEvent, useRef } from 'react'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'

import {
  type HostPreferences,
  rememberedSetupFor,
  restoredSettings
} from '@melee/core/room/host-preferences'
import {
  type ReadyMadeLineUpId,
  readyMadeLineUpsFor,
  savedEveningOfReadyMade
} from '@melee/core/room/ready-made-line-ups'
import { withSavedEvening } from '@melee/core/room/saved-evening'

import { useHostArrival } from '@/infrastructure/router/navigation'
import { useI18n } from '@/presentation/i18n/i18n-provider'

/**
 * A room is created by the server, on the server's defaults, so what this host
 * last set is applied from here — one frame, in the lobby, and never again for
 * this room. A console opened from a line-up on the home page — a ready-made
 * one, or one the host kept or played — lays that line-up over it in the same
 * frame, then lets go of it, so a reload in the lobby does not lay it over
 * whatever the host changed since.
 *
 * Only the *first* view counts, whatever phase it arrives in. A console that
 * reloaded mid-game must not re-apply anything: the server would refuse the
 * three settings a round is built on, and the rest would be somebody's evening
 * rearranged under them between two rounds.
 */
export const useRestoreStoredSetup = ({
  onReadyMadeLoaded,
  onRestore,
  preferences,
  view
}: {
  /** Told which ready-made line-up the frame put the room on. */
  onReadyMadeLoaded: (id: ReadyMadeLineUpId) => void
  onRestore: (settings: RoomSettings) => void
  preferences: HostPreferences | null
  view: HostRoomView | null
}): void => {
  const hasSeenRoom = useRef(false)
  const arrival = useHostArrival()
  const { locale, translate } = useI18n()

  const restore = useEffectEvent((room: HostRoomView) => {
    const readyMade = readyMadeLineUpsFor(locale).find(
      ({ id }) => id === arrival.readyMade
    )
    const evening =
      arrival.evening ??
      (readyMade === undefined
        ? null
        : savedEveningOfReadyMade({
            lineUp: readyMade,
            name: translate(`readyMade.lineUps.${readyMade.id}.name`)
          }))

    if (room.phase !== 'lobby') {
      return
    }

    const restored =
      preferences === null
        ? room.settings
        : restoredSettings({ preferences, settings: room.settings })

    if (evening === null) {
      if (preferences !== null) {
        onRestore(restored)
      }

      return
    }

    onRestore(
      withSavedEvening({
        evening,
        locale,
        rememberedFor: (game) => rememberedSetupFor({ game, preferences }),
        settings: restored
      })
    )

    if (readyMade !== undefined) {
      onReadyMadeLoaded(readyMade.id)
    }

    arrival.forget()
  })

  useEffect(() => {
    if (view === null || hasSeenRoom.current) {
      return
    }

    hasSeenRoom.current = true
    restore(view)
  }, [view])
}
