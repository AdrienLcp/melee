import type {
  MatchsticksPuzzle,
  MatchsticksSolution,
  StickMove
} from '@melee/protocol/matchsticks'

import { emptyPlacesOf, glyphWith, sticksOf } from './glyphs'

/**
 * Whether the move lifts a stick that is there and lays it on a place that is
 * empty — all a move has to be. What the sticks read as afterwards is
 * `applyMove`'s question, and a move that reads as nothing is still a move: it
 * simply answers nothing.
 */
export const isPlayableMove = ({
  glyphs,
  move
}: {
  glyphs: string
  move: StickMove
}): boolean => {
  const chars = [...glyphs]
  const { from, to } = move
  const fromGlyph = chars[from.glyphIndex]
  const toGlyph = chars[to.glyphIndex]

  return (
    fromGlyph !== undefined &&
    toGlyph !== undefined &&
    sticksOf(fromGlyph).includes(from.slot) &&
    emptyPlacesOf(toGlyph).includes(to.slot)
  )
}

/**
 * The puzzle once this stick has moved, or `null` when the sticks then read as
 * nothing — a glyph left behind or made that is no digit or sign — or the move
 * is not `isPlayableMove`. A stick lifted off one glyph has to leave a glyph
 * behind, and laid on another has to make one; moved on the same glyph, only
 * the result counts.
 */
export const applyMove = ({
  glyphs,
  move
}: {
  glyphs: string
  move: StickMove
}): string | null => {
  if (!isPlayableMove({ glyphs, move })) {
    return null
  }

  const chars = [...glyphs]
  const { from, to } = move
  const fromGlyph = chars[from.glyphIndex] ?? ''
  const toGlyph = chars[to.glyphIndex] ?? ''

  const kept = sticksOf(fromGlyph).filter((slot) => slot !== from.slot)

  if (from.glyphIndex === to.glyphIndex) {
    const reshaped = glyphWith({ place: toGlyph, sticks: [...kept, to.slot] })

    return reshaped === null
      ? null
      : chars.with(to.glyphIndex, reshaped).join('')
  }

  const lifted = glyphWith({ place: fromGlyph, sticks: kept })
  const laid = glyphWith({
    place: toGlyph,
    sticks: [...sticksOf(toGlyph), to.slot]
  })

  return lifted === null || laid === null
    ? null
    : chars.with(from.glyphIndex, lifted).with(to.glyphIndex, laid).join('')
}

/**
 * Every puzzle one stick away from this one, each with the move that reaches
 * it — every move `applyMove` accepts, so what the solver offers and what the
 * server takes from a screen cannot disagree.
 */
export const oneStickMoves = (glyphs: string): MatchsticksSolution[] => {
  const chars = [...glyphs]

  return chars.flatMap((fromGlyph, fromIndex) =>
    sticksOf(fromGlyph).flatMap((fromSlot) =>
      chars.flatMap((toGlyph, toIndex) =>
        emptyPlacesOf(toGlyph).flatMap((toSlot) => {
          const move = {
            from: { glyphIndex: fromIndex, slot: fromSlot },
            to: { glyphIndex: toIndex, slot: toSlot }
          }
          const moved = applyMove({ glyphs, move })

          return moved === null ? [] : [{ glyphs: moved, move }]
        })
      )
    )
  )
}

/** A number as a room writes one: `0` alone, never with a zero in front. */
const NUMBER = /^(0|[1-9][0-9]*)$/

export const numberValue = (glyphs: string): number | null =>
  NUMBER.test(glyphs) ? Number(glyphs) : null

/** Numbers joined by `+` and `-`, read left to right, or `null` when that is not what it says. */
const expressionValue = (text: string): number | null => {
  const [first, ...rest] = text.split(/([+-])/)
  let total = first === undefined ? null : numberValue(first)

  for (let index = 0; index < rest.length && total !== null; index += 2) {
    const sign = rest[index]
    const operand = numberValue(rest[index + 1] ?? '')

    total =
      operand === null ? null : sign === '+' ? total + operand : total - operand
  }

  return total
}

const sidesOf = (glyphs: string): [number, number] | null => {
  const sides = glyphs.split('=')

  if (sides.length !== 2) {
    return null
  }

  const left = expressionValue(sides[0] ?? '')
  const right = expressionValue(sides[1] ?? '')

  return left === null || right === null ? null : [left, right]
}

/** Reads as an equation at all, true or not. */
export const isWellFormedEquation = (glyphs: string): boolean =>
  sidesOf(glyphs) !== null

export const isTrueEquation = (glyphs: string): boolean => {
  const sides = sidesOf(glyphs)

  return sides !== null && sides[0] === sides[1]
}

const equationSolutions = (glyphs: string): MatchsticksSolution[] =>
  oneStickMoves(glyphs).filter((moved) => isTrueEquation(moved.glyphs))

/**
 * The moves that make the number the biggest (or smallest) one stick can, and
 * none when no move improves on it — every one of them is the answer, because
 * two moves reaching the same best number are equally right.
 */
const extremeNumberSolutions = ({
  glyphs,
  goal
}: {
  glyphs: string
  goal: 'biggest' | 'smallest'
}): MatchsticksSolution[] => {
  const original = numberValue(glyphs)

  if (original === null) {
    return []
  }

  const reached = oneStickMoves(glyphs).flatMap((moved) => {
    const value = numberValue(moved.glyphs)

    return value === null ? [] : [{ moved, value }]
  })

  const isBetter = (value: number, than: number) =>
    goal === 'biggest' ? value > than : value < than

  const best = reached.reduce(
    (held, { value }) => (isBetter(value, held) ? value : held),
    original
  )

  return best === original
    ? []
    : reached.filter(({ value }) => value === best).map(({ moved }) => moved)
}

/** Every move that answers the puzzle; empty when nothing does. */
export const solutionsOf = (
  puzzle: MatchsticksPuzzle
): MatchsticksSolution[] =>
  puzzle.goal === 'equation'
    ? equationSolutions(puzzle.glyphs)
    : extremeNumberSolutions({ glyphs: puzzle.glyphs, goal: puzzle.goal })
