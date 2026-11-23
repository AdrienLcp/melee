import type { PlayerId } from '@melee/protocol/identifiers'
import type { PlayedGame } from '@melee/protocol/played-game'

export type GameBest = {
  /**
   * The best seats' points a round on that game, on the board's scale:
   * their total over every round the room played on it, so a seat that sat
   * down late is not crowned by the one round it played.
   */
  average: number
  /** Every seat sharing the best total, in the order the game paid them; empty when it paid nobody. */
  bestIds: PlayerId[]
  game: PlayedGame
}

/**
 * Who played each game of the evening best, among the seats still at the
 * table: the highest total on its rounds, a tie crowning every seat in it.
 * Ranking by the average is ranking by the total, every seat sharing the one
 * round count.
 */
export const bestPerGame = ({
  games,
  seatIds
}: {
  games: readonly PlayedGame[]
  seatIds: readonly PlayerId[]
}): GameBest[] =>
  games.map((game) => {
    const seated = game.totals.filter(
      (total) => total.points > 0 && seatIds.includes(total.playerId)
    )
    const best = Math.max(0, ...seated.map((total) => total.points))

    return {
      average: best / game.roundCount,
      bestIds: seated
        .filter((total) => total.points === best)
        .map((total) => total.playerId),
      game
    }
  })
