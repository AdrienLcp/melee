import { useEffect } from 'react'

import { type ShelvedGame, shelvedGameSchema } from '@melee/protocol/game'
import type { HostRoomView } from '@melee/protocol/room'

import { kindsInLineUp } from '@melee/core/room/line-up'

import { writeStoredLineUpGames } from '@/infrastructure/storage/preferences-storage'

const SEPARATOR = ' '

const shelvedOf = (games: readonly string[]): ShelvedGame[] =>
  games.flatMap((game) => {
    const shelved = shelvedGameSchema.safeParse(game)

    return shelved.success ? [shelved.data] : []
  })

/**
 * Keeps the games of this evening, in the order they were ticked, for the home
 * tray's next table. Read off the room's view, so it is the line-up the server
 * accepted rather than the one a press asked for. A room of one game leaves
 * the last evening as it was: that host chose a game tonight, not another
 * evening.
 */
export const useRememberLineUpGames = (view: HostRoomView | null): void => {
  // A string, so the effect runs when the games change and not on every view.
  const tickedKey =
    view === null ? '' : kindsInLineUp(view.settings.lineUp).join(SEPARATOR)

  useEffect(() => {
    const games = shelvedOf(tickedKey.split(SEPARATOR))

    if (games.length > 1) {
      writeStoredLineUpGames(games)
    }
  }, [tickedKey])
}
