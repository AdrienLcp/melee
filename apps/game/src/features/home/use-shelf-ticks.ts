import { useState } from 'react'

import type { ShelvedGame } from '@melee/protocol/game'

import { familyGames } from '@melee/core/room/shelf-families'

import {
  readStoredLineUpGames,
  writeStoredLineUpGames
} from '@/infrastructure/storage/preferences-storage'

/**
 * The games ticked on the home shelf, which the host's door opens a table on.
 * A device that never ticked one opens on every family's games — what _Tick
 * all_ ticks, the host's tools left out — so a first visit reads as a rule
 * rather than a handful picked for it. Every change is written at once, an
 * empty shelf included: unticking everything is a choice the next visit keeps.
 */
export const useShelfTicks = () => {
  const [ticked, setTicked] = useState<readonly ShelvedGame[]>(() => {
    const stored = readStoredLineUpGames()

    return stored.status === 'success' && stored.data !== null
      ? stored.data
      : familyGames
  })

  const tickOnly = (games: readonly ShelvedGame[]): void => {
    setTicked(games)
    writeStoredLineUpGames(games)
  }

  return {
    /**
     * Ticks or unticks `games` and leaves every other tick as it was; a game
     * ticked joins the end, in the order the table will meet them.
     */
    tick: ({
      games,
      isTicked
    }: {
      games: readonly ShelvedGame[]
      isTicked: boolean
    }) =>
      tickOnly(
        isTicked
          ? [...ticked, ...games.filter((game) => !ticked.includes(game))]
          : ticked.filter((tickedGame) => !games.includes(tickedGame))
      ),
    ticked,
    /** Ticks `games` and nothing else. */
    tickOnly
  }
}

/** What `useShelfTicks` hands the shelf and the host's door. */
export type ShelfTicks = ReturnType<typeof useShelfTicks>
