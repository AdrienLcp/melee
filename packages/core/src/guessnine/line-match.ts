import type { GuessNineCell } from '@melee/protocol/guess-nine'

import { matchesAnswer } from '../round/answer-matching'

/** Every name a table may type for one answer, in every language. */
type Names = readonly string[]

export type LineGrade =
  | { cells: GuessNineCell[]; kind: 'cells' }
  | { kind: 'blackWord' }
  | { kind: 'nothing' }

const matchesAnyOf = ({
  line,
  names,
  rivals
}: {
  line: string
  names: Names
  rivals: Names
}): boolean =>
  names.some((expected) =>
    matchesAnswer({ distinctFrom: rivals, expected, given: line })
  )

/**
 * One line against the answers dealt and the black word, matched whole with the quiz's
 * forgiveness. Every other name on the board is a rival, so a slipped finger is
 * never forgiven into a neighbour: *Terminator 3* is not *Terminator 2*, and
 * *True Romanc* is not a hit it cannot be.
 *
 * The answers are tried first and the black word only when none matches: the
 * bank strips from the black word every name an answer holds, and a line that
 * is both would void a sheet for something it got right.
 *
 * A line can match several cells — two films sharing a short name — and finds
 * every one, because it names each of them as well as the other.
 */
export const gradeLine = ({
  answers,
  blackWord,
  line
}: {
  /** The answers dealt, in cell order. */
  answers: readonly Names[]
  blackWord: Names
  line: string
}): LineGrade => {
  const cells = answers.flatMap((names, cell) =>
    matchesAnyOf({
      line,
      names,
      rivals: [
        ...blackWord,
        ...answers.flatMap((other, index) => (index === cell ? [] : other))
      ]
    })
      ? [cell]
      : []
  )

  if (cells.length > 0) {
    return { cells, kind: 'cells' }
  }

  return matchesAnyOf({ line, names: blackWord, rivals: answers.flat() })
    ? { kind: 'blackWord' }
    : { kind: 'nothing' }
}
