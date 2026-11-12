import type { BlackSquareCell } from '@melee/protocol/black-square'

import { answerMatcherFor } from '../round/answer-matching'

/** Every name a table may type for one answer, in every language. */
type Names = readonly string[]

export type LineGrade =
  | { cells: BlackSquareCell[]; kind: 'cells' }
  | { kind: 'blackWord' }
  | { kind: 'nothing' }

type Board = {
  /** The answers dealt, in cell order. */
  answers: readonly Names[]
  blackWord: Names
  /** Every name of the theme's true answers the deal did not draw. */
  leftOut: Names
}

const matcherOfAny = ({
  names,
  rivals
}: {
  names: Names
  rivals: Names
}): ((line: string) => boolean) => {
  const matchers = names.map((expected) =>
    answerMatcherFor({ distinctFrom: rivals, expected })
  )

  return (line) => matchers.some((matches) => matches(line))
}

/**
 * One line against the answers dealt and the black word, matched whole with the quiz's
 * forgiveness. Every other name on the board is a rival, so a slipped finger is
 * never forgiven into a neighbour: *Terminator 3* is not *Terminator 2*, and
 * *True Romanc* is not a hit it cannot be.
 *
 * The true answers the deal left out are rivals too, and never a cell: a
 * theme holding *Ireland* and *Iceland* deals one of them, and the other typed
 * is a miss rather than a typo of the one dealt — nor, beside a black word
 * close to it, a lost round.
 *
 * The answers are tried first and the black word only when none matches: the
 * bank strips from the black word every name an answer holds, and a line that
 * is both would void a sheet for something it got right.
 *
 * A line can match several cells — two films sharing a short name — and finds
 * every one, because it names each of them as well as the other.
 */
export const gradeLine = ({
  line,
  ...board
}: Board & { line: string }): LineGrade => lineGraderFor(board)(line)

/** `gradeLine` with each name's forgiveness settled once, for one board read line after line. */
export const lineGraderFor = ({
  answers,
  blackWord,
  leftOut
}: Board): ((line: string) => LineGrade) => {
  const cellMatchers = answers.map((names, cell) =>
    matcherOfAny({
      names,
      rivals: [
        ...blackWord,
        ...leftOut,
        ...answers.flatMap((other, index) => (index === cell ? [] : other))
      ]
    })
  )
  const matchesBlackWord = matcherOfAny({
    names: blackWord,
    rivals: [...answers.flat(), ...leftOut]
  })

  return (line) => {
    const cells = cellMatchers.flatMap((matches, cell) =>
      matches(line) ? [cell] : []
    )

    if (cells.length > 0) {
      return { cells, kind: 'cells' }
    }

    return matchesBlackWord(line) ? { kind: 'blackWord' } : { kind: 'nothing' }
  }
}
