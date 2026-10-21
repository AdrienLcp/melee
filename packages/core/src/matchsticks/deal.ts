import type {
  MatchsticksGoal,
  MatchsticksPuzzle,
  MatchsticksSolution
} from '@melee/protocol/matchsticks'

import { pickRandom, randomIntBetween } from '../helpers/random'
import {
  isTrueEquation,
  isWellFormedEquation,
  oneStickMoves,
  solutionsOf
} from './one-move'

export type DealtPuzzle = {
  puzzle: MatchsticksPuzzle
  /** Never empty: a puzzle with no answer is redrawn rather than dealt. */
  solutions: MatchsticksSolution[]
}

/**
 * How many draws a deal tries before giving up. A draw is almost always
 * solvable, so this is only reached by a room that has seen most of what one
 * goal can deal.
 */
const DEAL_ATTEMPTS = 200

/** Single digits either side, so the equation fits a phone held upright. */
const trueEquation = (): string => {
  const first = randomIntBetween(0, 9)
  const second = randomIntBetween(0, 9)

  if (pickRandom(['+', '-']) === '+') {
    return `${first}+${second}=${first + second}`
  }

  const [larger, smaller] = first >= second ? [first, second] : [second, first]

  return `${larger}-${smaller}=${larger - smaller}`
}

/**
 * A true equation knocked false by one stick, so it is solvable by
 * construction — moving the stick back is always one answer, and the solver
 * finds any other.
 */
const falseEquation = (): string | null =>
  pickRandom(
    oneStickMoves(trueEquation()).filter(
      (moved) =>
        isWellFormedEquation(moved.glyphs) && !isTrueEquation(moved.glyphs)
    )
  )?.glyphs ?? null

/** Three or four digits, the first not a zero. */
const randomNumber = (): string => {
  const digits = randomIntBetween(3, 4)

  return String(randomIntBetween(10 ** (digits - 1), 10 ** digits - 1))
}

const drawGlyphs = (goal: MatchsticksGoal): string | null =>
  goal === 'equation' ? falseEquation() : randomNumber()

/**
 * A puzzle the room has not been dealt, with every answer to it, or `null`
 * once `DEAL_ATTEMPTS` draws found nothing new. No bank: the server deals as
 * many as an evening asks for and knows every solution of each.
 */
export const dealPuzzle = ({
  goal,
  isPlayed
}: {
  goal: MatchsticksGoal
  isPlayed: (glyphs: string) => boolean
}): DealtPuzzle | null => {
  for (let attempt = 0; attempt < DEAL_ATTEMPTS; attempt++) {
    const glyphs = drawGlyphs(goal)

    if (glyphs === null || isPlayed(glyphs)) {
      continue
    }

    const puzzle = { glyphs, goal }
    const solutions = solutionsOf(puzzle)

    if (solutions.length > 0) {
      return { puzzle, solutions }
    }
  }

  return null
}
