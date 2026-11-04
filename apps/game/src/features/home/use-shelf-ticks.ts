import { useState } from 'react'

import { type ShelvedGame, shelvedGames } from '@melee/protocol/game'

import { isJudgedInEveryMode } from '@melee/core/room/game-modes'

import {
  readStoredLineUpGames,
  writeStoredLineUpGames
} from '@/infrastructure/storage/preferences-storage'

/** Every shelved game no answer mode leaves to the server. */
export const UNJUDGED_GAMES: readonly ShelvedGame[] = shelvedGames.filter(
  (game) => !isJudgedInEveryMode(game)
)

/**
 * The games ticked on the home shelf, which the host's door opens a table on.
 * A device that never ticked one opens on every game nobody has to judge —
 * the whole upper shelf, what *Tick all but the host's* ticks — so a first
 * visit reads as a rule rather than a handful picked for it. Every change is
 * written at once, an empty shelf included: unticking everything is a choice
 * the next visit keeps.
 */
export const useShelfTicks = () => {
  const [ticked, setTicked] = useState<readonly ShelvedGame[]>(() => {
    const stored = readStoredLineUpGames()

    return stored.status === 'success' && stored.data !== null
      ? stored.data
      : UNJUDGED_GAMES
  })

  const tickOnly = (games: readonly ShelvedGame[]): void => {
    setTicked(games)
    writeStoredLineUpGames(games)
  }

  return {
    ticked,
    /** Ticks `games` and nothing else, in the order the table will meet them. */
    tickOnly,
    toggle: ({ game, isTicked }: { game: ShelvedGame; isTicked: boolean }) =>
      tickOnly(
        isTicked
          ? [...ticked, game]
          : ticked.filter((tickedGame) => tickedGame !== game)
      )
  }
}

/** What `useShelfTicks` hands the shelf and the host's door. */
export type ShelfTicks = ReturnType<typeof useShelfTicks>
