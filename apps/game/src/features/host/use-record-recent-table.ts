import { useEffect, useEffectEvent } from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import type { ReadyMadeLineUpId } from '@melee/core/room/ready-made-line-ups'
import {
  isSameLineUp,
  readyMadeOfTable,
  recentTableOf,
  withTablePlayed
} from '@melee/core/room/recent-tables'

import { nowMs } from '@/infrastructure/clock'
import {
  readStoredRecentTables,
  writeStoredRecentTables
} from '@/infrastructure/storage/preferences-storage'
import { useI18n } from '@/presentation/i18n/i18n-provider'

/**
 * Remembers the line-up this console runs among the recent tables, each time
 * a round's answer goes up, so the home page offers it again. A table nothing
 * was revealed at is not one this host played.
 *
 * A record already holding this room at this count on this line-up is left
 * as it is, which is what keeps a console reloaded on a reveal from moving the
 * table to the top of the list again.
 */
export const useRecordRecentTable = ({
  readyMade,
  view
}: {
  /** The ready-made line-up the console loaded, or `null`. */
  readyMade: ReadyMadeLineUpId | null
  view: HostRoomView | null
}): void => {
  const { locale } = useI18n()
  const roomCode = view?.code ?? null
  const roundsRevealed =
    view?.phase === 'revealed' ? (view.round?.index ?? null) : null

  const record = useEffectEvent(() => {
    if (view === null || roomCode === null || roundsRevealed === null) {
      return
    }

    const stored = readStoredRecentTables()
    const recents = stored.status === 'success' ? stored.data : []
    const table = recentTableOf({
      now: nowMs(),
      readyMade: readyMadeOfTable({
        loaded: readyMade,
        locale,
        recents,
        roomCode,
        settings: view.settings
      }),
      roomCode,
      roundsPlayed: roundsRevealed,
      settings: view.settings
    })
    const isRecordedAlready = recents.some(
      (recent) =>
        recent.roomCode === roomCode &&
        recent.roundsPlayed === roundsRevealed &&
        isSameLineUp({ left: recent, right: table })
    )

    if (!isRecordedAlready) {
      writeStoredRecentTables(withTablePlayed({ recents, table }))
    }
  })

  useEffect(() => {
    if (roomCode !== null && roundsRevealed !== null) {
      record()
    }
  }, [roomCode, roundsRevealed])
}
