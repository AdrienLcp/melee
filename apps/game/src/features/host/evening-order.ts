import type { Locale } from '@melee/protocol/locale'
import type { HostRoomView, RoomSettings } from '@melee/protocol/room'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { endsTheEvening } from '@melee/core/room/next-game'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import { movedToEntry } from '@melee/core/room/room-settings'
import {
  type ComingRound,
  comingRounds,
  orderWithComingRounds
} from '@melee/core/room/running-order'

/** Where the evening stands for its running order, as the console draws it. */
export type EveningOrder = {
  coming: ComingRound[]
  /** Between two rounds: the next one is settled on its entry. */
  isDrawn: boolean
  /** The round on screen is the evening's last, so nothing comes next. */
  isEveningOver: boolean
  /** The round about to open, counted from 0. */
  upcoming: number
}

export const eveningOrderOf = (view: HostRoomView): EveningOrder => {
  const { lineUp, lineUpAt, roundCount, runningOrder } = view.settings
  const upcoming = view.round?.index ?? 0
  const isEveningOver =
    view.phase === 'revealed' &&
    endsTheEvening({
      lineUp,
      played: view.lineUpPlayed,
      roundCount,
      roundIndex: upcoming
    })
  const isDrawn = !isRoundInPlay(view.phase) && !isEveningOver

  return {
    coming: comingRounds({
      drawnAt: isDrawn ? lineUpAt : null,
      order: runningOrder,
      roundCount,
      upcoming
    }),
    isDrawn,
    isEveningOver,
    upcoming
  }
}

/**
 * The evening once the rounds to come are put in `rows`' order. A round put
 * first is the next one, so the room moves onto its entry — between two rounds
 * only: mid-round the room stays on the game being played, and the reveal's
 * draw reads the new order.
 */
export const arrangedEvening = ({
  locale,
  preferences,
  rows,
  upcoming,
  view
}: {
  locale: Locale
  preferences: HostPreferences | null
  rows: readonly number[]
  /** The round about to open, counted from 0. */
  upcoming: number
  view: HostRoomView
}): RoomSettings => {
  const { settings } = view
  const runningOrder = orderWithComingRounds({
    order: settings.runningOrder,
    rows,
    upcoming
  })
  const first = rows[0]
  const entry = first === undefined ? undefined : settings.lineUp[first]

  if (first === undefined || entry === undefined || isRoundInPlay(view.phase)) {
    return { ...settings, runningOrder }
  }

  const moved =
    first === settings.lineUpAt
      ? settings
      : movedToEntry({
          at: first,
          locale,
          remembered: rememberedSetupFor({ game: entry.kind, preferences }),
          settings
        })

  return { ...moved, runningOrder }
}
