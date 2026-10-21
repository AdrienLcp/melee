import type { BoardStrategy } from '@melee/protocol/board'
import type { TeamId } from '@melee/protocol/team'

import { onePointOneCase } from './one-point-one-case'
import { rank } from './rank'

export type TeamRoundResult = {
  /** What the round paid the team, in the board's units — a thousand to the `POINT`. */
  points: number
  teamId: TeamId
}

export type TeamMove = {
  cases: number
  teamId: TeamId
}

/**
 * How one settled round walks the pawns. Pure, and run on the server, so every
 * screen draws the same moves; a new way to race is a new file beside this one
 * and a new literal in `boardStrategySchema`, and nothing else changes.
 *
 * A strategy says how far each pawn goes and nothing about where it stops:
 * the track's end is the same wall for every strategy, so `advanceOnTrack`
 * owns it.
 */
export type BoardStrategyRule = (
  results: readonly TeamRoundResult[]
) => TeamMove[]

const STRATEGIES: Record<BoardStrategy, BoardStrategyRule> = {
  onePointOneCase,
  rank
}

export type TrackProgress = {
  isOver: boolean
  /** Each team's case after the round, in the order the results came in. */
  positions: { case: number; teamId: TeamId }[]
  moves: TeamMove[]
}

/**
 * The one team standing alone on the rearmost case, or `null` when the back
 * is shared — two pawns level at the back are a race, not a team left behind.
 */
const loneLastTeam = ({
  positions,
  results
}: {
  positions: ReadonlyMap<TeamId, number>
  results: readonly TeamRoundResult[]
}): TeamId | null => {
  const cases = results.map((result) => ({
    case: positions.get(result.teamId) ?? 0,
    teamId: result.teamId
  }))
  const rearmost = Math.min(...cases.map((entry) => entry.case))
  const atTheBack = cases.filter((entry) => entry.case === rearmost)

  return cases.length > 1 && atTheBack.length === 1
    ? (atTheBack[0]?.teamId ?? null)
    : null
}

/**
 * One round on the track: the strategy's moves, the catch-up case on top, each
 * pawn stopped at the last case, and whether a pawn has reached it — the
 * evening's other end, beside the round count and the host's *End*.
 */
export const advanceOnTrack = ({
  catchUp,
  length,
  positions,
  results,
  strategy
}: {
  catchUp: boolean
  length: number
  positions: ReadonlyMap<TeamId, number>
  results: readonly TeamRoundResult[]
  strategy: BoardStrategy
}): TrackProgress => {
  const behind = catchUp ? loneLastTeam({ positions, results }) : null

  const moves = STRATEGIES[strategy](results).map((move) => {
    const from = positions.get(move.teamId) ?? 0
    const bonus = move.teamId === behind && move.cases > 0 ? 1 : 0

    return {
      ...move,
      cases: Math.max(0, Math.min(move.cases + bonus, length - from))
    }
  })

  const after = moves.map((move) => ({
    case: (positions.get(move.teamId) ?? 0) + move.cases,
    teamId: move.teamId
  }))

  return {
    isOver: after.some((position) => position.case >= length),
    moves,
    positions: after
  }
}
