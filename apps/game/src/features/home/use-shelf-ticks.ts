import { useState } from 'react'

import { type ShelvedGame, shelvedGames } from '@melee/protocol/game'

import { isJudgedInEveryMode } from '@melee/core/room/game-modes'
import {
  gamesOfLineUp,
  readyMadeLineUpsFor
} from '@melee/core/room/ready-made-line-ups'

import {
  readStoredLineUpGames,
  writeStoredLineUpGames
} from '@/infrastructure/storage/preferences-storage'
import { useI18n } from '@/presentation/i18n/i18n-provider'

/** Every shelved game no answer mode leaves to the server. */
export const UNJUDGED_GAMES: readonly ShelvedGame[] = shelvedGames.filter(
  (game) => !isJudgedInEveryMode(game)
)

/**
 * The games ticked on the home shelf, which the host's door opens a table on.
 * A device that never ticked one opens on the first ready-made box's games, so
 * the door reads *Open a table · 5 games* on a first visit rather than an empty
 * lobby. Every change is written at once, an empty shelf included: unticking
 * everything is a choice the next visit keeps.
 */
export const useShelfTicks = () => {
  const { locale } = useI18n()
  const [ticked, setTicked] = useState<readonly ShelvedGame[]>(() => {
    const stored = readStoredLineUpGames()

    if (stored.status === 'success' && stored.data !== null) {
      return stored.data
    }

    const [firstGame] = readyMadeLineUpsFor(locale)

    return firstGame === undefined ? [] : gamesOfLineUp(firstGame)
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
