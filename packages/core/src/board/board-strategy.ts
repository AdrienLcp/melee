import type { BoardStrategy } from '@melee/protocol/board'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { TeamId } from '@melee/protocol/team'

import { onePointOneCase } from './one-point-one-case'
import { rank } from './rank'

/**
 * Whose pawn walks: a team's in a room that plays in teams, a seat's in one
 * that does not. The track never asks which.
 */
export type PawnId = PlayerId | TeamId

export type PawnRoundResult = {
  pawnId: PawnId
  /** What the round paid the pawn, in the board's units — a thousand to the `POINT`. */
  points: number
}

export type PawnMove = {
  cases: number
  pawnId: PawnId
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
  results: readonly PawnRoundResult[]
) => PawnMove[]

const STRATEGIES: Record<BoardStrategy, BoardStrategyRule> = {
  onePointOneCase,
  rank
}

export type TrackProgress = {
  isOver: boolean
  /** Each pawn's case after the round, in the order the results came in. */
  positions: { case: number; pawnId: PawnId }[]
  moves: PawnMove[]
}

/**
 * The one pawn standing alone on the rearmost case, or `null` when the back
 * is shared — two pawns level at the back are a race, not a pawn left behind.
 */
const loneLastPawn = ({
  positions,
  results
}: {
  positions: ReadonlyMap<PawnId, number>
  results: readonly PawnRoundResult[]
}): PawnId | null => {
  const cases = results.map((result) => ({
    case: positions.get(result.pawnId) ?? 0,
    pawnId: result.pawnId
  }))
  const rearmost = Math.min(...cases.map((entry) => entry.case))
  const atTheBack = cases.filter((entry) => entry.case === rearmost)

  return cases.length > 1 && atTheBack.length === 1
    ? (atTheBack[0]?.pawnId ?? null)
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
  positions: ReadonlyMap<PawnId, number>
  results: readonly PawnRoundResult[]
  strategy: BoardStrategy
}): TrackProgress => {
  const behind = catchUp ? loneLastPawn({ positions, results }) : null

  const moves = STRATEGIES[strategy](results).map((move) => {
    const from = positions.get(move.pawnId) ?? 0
    const bonus = move.pawnId === behind && move.cases > 0 ? 1 : 0

    return {
      ...move,
      cases: Math.max(0, Math.min(move.cases + bonus, length - from))
    }
  })

  const after = moves.map((move) => ({
    case: (positions.get(move.pawnId) ?? 0) + move.cases,
    pawnId: move.pawnId
  }))

  return {
    isOver: after.some((position) => position.case >= length),
    moves,
    positions: after
  }
}
