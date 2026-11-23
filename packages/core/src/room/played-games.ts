import type { GameSettings } from '@melee/protocol/game'
import type { PlayedGame, SeatTotal } from '@melee/protocol/played-game'

/**
 * Every line-up entry the game opened a round on, in the order each was first
 * played, with what each seat earned on it. An entry is told apart by value,
 * the way `playedPerEntry` tells it, because an edit to the line-up shifts its
 * indices: two rounds of one entry are one game, and the same game edited in
 * between is two.
 */
export const playedGamesOf = ({
  lineUp,
  opened,
  paid
}: {
  lineUp: readonly GameSettings[]
  /** The entry each round of this game opened on, in order. */
  opened: readonly GameSettings[]
  /** What each of those rounds paid each seat, by the same index; missing is nothing. */
  paid: readonly (readonly SeatTotal[] | undefined)[]
}): PlayedGame[] => {
  const keys = lineUp.map((entry) => JSON.stringify(entry))
  const games = new Map<string, PlayedGame>()

  opened.forEach((entry, roundAt) => {
    const key = JSON.stringify(entry)
    const lineUpAt = keys.indexOf(key)
    const game = games.get(key) ?? {
      kind: entry.kind,
      lineUpAt: lineUpAt === -1 ? null : lineUpAt,
      roundCount: 0,
      totals: []
    }

    games.set(key, {
      ...game,
      roundCount: game.roundCount + 1,
      totals: withRoundAdded({
        round: paid[roundAt] ?? [],
        totals: game.totals
      })
    })
  })

  return [...games.values()]
}

const withRoundAdded = ({
  round,
  totals
}: {
  round: readonly SeatTotal[]
  totals: readonly SeatTotal[]
}): SeatTotal[] => {
  const byPlayer = new Map(
    totals.map(({ playerId, points }) => [playerId, points])
  )

  for (const { playerId, points } of round) {
    if (points > 0) {
      byPlayer.set(playerId, (byPlayer.get(playerId) ?? 0) + points)
    }
  }

  return [...byPlayer].map(([playerId, points]) => ({ playerId, points }))
}

/**
 * What one round paid each seat, summed over its awards: the round's own
 * figures, never the host's corrections to the board.
 */
export const roundTotalsOf = (awards: readonly SeatTotal[]): SeatTotal[] =>
  withRoundAdded({ round: awards, totals: [] })
