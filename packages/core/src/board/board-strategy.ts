import type { BoardStrategy } from '@melee/protocol/board'
import type { TeamId } from '@melee/protocol/team'

import { onePointOneCase } from './one-point-one-case'

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
  onePointOneCase
}

export type TrackProgress = {
  isOver: boolean
  /** Each team's case after the round, in the order the results came in. */
  positions: { case: number; teamId: TeamId }[]
  moves: TeamMove[]
}

/**
 * One round on the track: the strategy's moves, each pawn stopped at the last
 * case, and whether a pawn has reached it — the evening's other end, beside
 * the round count and the host's *End*.
 */
export const advanceOnTrack = ({
  length,
  positions,
  results,
  strategy
}: {
  length: number
  positions: ReadonlyMap<TeamId, number>
  results: readonly TeamRoundResult[]
  strategy: BoardStrategy
}): TrackProgress => {
  const moves = STRATEGIES[strategy](results).map((move) => {
    const from = positions.get(move.teamId) ?? 0

    return { ...move, cases: Math.max(0, Math.min(move.cases, length - from)) }
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
