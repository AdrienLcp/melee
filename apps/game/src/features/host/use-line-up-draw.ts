import { useEffect, useRef } from 'react'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { endsTheEvening } from '@melee/core/room/next-game'
import { movedToEntry } from '@melee/core/room/room-settings'
import { scheduledEntryAt } from '@melee/core/room/running-order'

import { useI18n } from '@/presentation/i18n/i18n-provider'

/**
 * Deals the next round's game as each reveal of an evening goes up
 * (`scheduledEntryAt` says how), and sends it as an ordinary settings frame — so
 * the wall reads it off `settings.game`
 * like everything else, and the host's *change* is the same frame again.
 *
 * Once per round on this screen: a host who picks the game just played back
 * is answered, not drawn over. A reveal whose settings already moved off the
 * entry the round was opened from was drawn before a reload, or picked by the
 * host, and is left as it is — compared by entry rather than by game, because
 * two variants of one game share a kind. The last round of
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
    const isFinal = endsTheEvening({
      lineUp: settings.lineUp,
      played: view.lineUpPlayed,
      roundCount: settings.roundCount,
      roundIndex: round.index
    })

    if (
      isFinal ||
      settings.lineUp.length < 2 ||
      settings.lineUpAt !== round.lineUpAt
    ) {
      return
    }

    const drawn = scheduledEntryAt({
      deals: settings.lineUpDeals,
      lastAt: round.lineUpAt,
      lineUp: settings.lineUp,
      order: settings.runningOrder,
      played: view.lineUpPlayed,
      random: Math.random,
      roundAt: round.index,
      roundsLeft:
        settings.roundCount === null ? null : settings.roundCount - round.index
    })
    const entry = drawn === null ? undefined : settings.lineUp[drawn]

    if (drawn !== null && entry !== undefined && drawn !== settings.lineUpAt) {
      onSettingsChange(
        movedToEntry({
          at: drawn,
          locale,
          remembered: rememberedSetupFor({ game: entry.kind, preferences }),
          settings
        })
      )
    }
  }, [isLive, locale, onSettingsChange, preferences, view])
}
