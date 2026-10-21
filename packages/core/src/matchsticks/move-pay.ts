import type { MatchsticksPuzzle } from '@melee/protocol/matchsticks'
import { type MoveVerdict, POINT } from '@melee/protocol/scoring'

import { isTrueEquation, numberValue, oneStickMoves } from './one-move'

type MoveTier = { points: number; withinPlacesFromBest: number }

/**
 * What a move earns by how far what it made sits from the best answer, on the
 * timeline's scale: the best is the typed answer's price, the next two numbers
 * down still pay, and anything further is a move any shuffle of sticks finds.
 */
export const MOVE_TIERS = [
  { points: 3 * POINT, withinPlacesFromBest: 0 },
  { points: 2 * POINT, withinPlacesFromBest: 1 },
  { points: POINT, withinPlacesFromBest: 2 }
] as const satisfies readonly MoveTier[]

/** What a move this far from the best earns, before the clock adds to it. */
export const pointsForMove = ({
  placesFromBest
}: Pick<MoveVerdict, 'placesFromBest'>): number =>
  placesFromBest === null
    ? 0
    : (MOVE_TIERS.find(
        ({ withinPlacesFromBest }: MoveTier) =>
          placesFromBest <= withinPlacesFromBest
      )?.points ?? 0)

export const isBestMove = ({
  placesFromBest
}: Pick<MoveVerdict, 'placesFromBest'>): boolean => placesFromBest === 0

/**
 * Every number one stick makes of `glyphs` that improves on it, best first and
 * each once — two moves reaching the same number share its place.
 */
const improvementsOf = ({
  glyphs,
  goal
}: {
  glyphs: string
  goal: 'biggest' | 'smallest'
}): number[] => {
  const original = numberValue(glyphs)

  if (original === null) {
    return []
  }

  const reached = new Set(
    oneStickMoves(glyphs).flatMap((moved) => {
      const value = numberValue(moved.glyphs)

      return value === null ? [] : [value]
    })
  )
  const improving = [...reached].filter((value) =>
    goal === 'biggest' ? value > original : value < original
  )

  return improving.toSorted((one, other) =>
    goal === 'biggest' ? other - one : one - other
  )
}

/**
 * Where what a move made sits among the puzzle's answers, best first: `0` for
 * a true equation or the best number, `null` for anything that answers
 * nothing. `made` is the puzzle after the move, which `applyMove` gives.
 */
export const placesFromBestOf = ({
  made,
  puzzle
}: {
  made: string
  puzzle: MatchsticksPuzzle
}): number | null => {
  if (puzzle.goal === 'equation') {
    return isTrueEquation(made) ? 0 : null
  }

  const value = numberValue(made)
  const place =
    value === null
      ? -1
      : improvementsOf({ glyphs: puzzle.glyphs, goal: puzzle.goal }).indexOf(
          value
        )

  return place === -1 ? null : place
}
