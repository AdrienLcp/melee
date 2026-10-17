import { useEffect, useRef } from 'react'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { nextGame } from '@melee/core/room/next-game'
import { movedToGame } from '@melee/core/room/room-settings'

import { useI18n } from '@/presentation/i18n/i18n-provider'

/**
 * Draws the next round's game as each reveal of an evening goes up, and sends
 * it as an ordinary settings frame — so the wall reads it off `settings.game`
 * like everything else, and the host's *change* is the same frame again.
 *
 * Once per round on this screen: a host who picks the game just played back
 * is answered, not drawn over. A reveal that already moved off the game it
 * revealed was drawn before a reload, and is left as it is. The last round of
 * a counted evening has no next one to draw.
 */
export const useLineUpDraw = ({
  isLive,
  onSettingsChange,
  preferences,
  view
}: {
  isLive: boolean
  onSettingsChange: (settings: RoomSettings) => void
  preferences: HostPreferences | null
  view: HostRoomView | null
}): void => {
  const { locale } = useI18n()
  const drawnForRoundId = useRef<string | null>(null)

  useEffect(() => {
    const round = view?.round

    if (!isLive || view?.phase !== 'revealed' || round == null) {
      return
    }

    if (drawnForRoundId.current === round.id) {
      return
    }

    drawnForRoundId.current = round.id

    const { settings } = view
    const last = round.content.kind
    const isFinal =
      settings.roundCount !== null && round.index >= settings.roundCount

    if (isFinal || settings.lineUp.length < 2 || settings.game?.kind !== last) {
      return
    }

    const drawn = nextGame({
      last,
      lineUp: settings.lineUp,
      random: Math.random
    })

    if (drawn !== null && drawn !== last) {
      onSettingsChange(
        movedToGame({
          game: drawn,
          locale,
          remembered: rememberedSetupFor({ game: drawn, preferences }),
          settings
        })
      )
    }
  }, [isLive, locale, onSettingsChange, preferences, view])
}
