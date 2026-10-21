import type { BoardStrategyRule } from './board-strategy'

const CASES_BY_PLACE = [3, 2, 1] as const

/**
 * The round's team ranking walks the pawns 3, 2 and 1 cases. Ranked on what
 * the round paid, speed bonus included, so a tie is two teams equally right
 * *and* equally quick; a tie shares the better place and the place after it
 * is skipped, as a podium counts. A team the round paid nothing is not on it:
 * in a set, the teams waiting for their turn are paid nothing, which is what
 * keeps a turn from ranking one team against teams that never played it.
 */
export const rank: BoardStrategyRule = (results) =>
  results.map((result) => {
    const place = results.filter((other) => other.points > result.points).length

    return {
      cases: result.points > 0 ? (CASES_BY_PLACE[place] ?? 0) : 0,
      teamId: result.teamId
    }
  })
