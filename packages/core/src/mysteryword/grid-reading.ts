import {
  type LetterMark,
  type LetterMarks,
  MYSTERY_WORD_TRY_COUNT,
  type SpelledTry
} from '@melee/protocol/mystery-word'

import { isFoundBy } from './letter-marks'

const MARK_RANK: Record<LetterMark, number> = {
  absent: 0,
  placed: 2,
  present: 1
}

/**
 * The best mark each letter has shown over a seat's tries, the way a keyboard
 * inks its keys: in place anywhere beats elsewhere, which beats absent. A
 * letter never typed is not in the map.
 */
export const bestMarkByLetter = (
  tries: readonly SpelledTry[]
): ReadonlyMap<string, LetterMark> => {
  const best = new Map<string, LetterMark>()

  for (const { marks, word } of tries) {
    ;[...word].forEach((letter, index) => {
      const mark = marks[index]
      const held = best.get(letter)

      if (
        mark !== undefined &&
        (held === undefined || MARK_RANK[mark] > MARK_RANK[held])
      ) {
        best.set(letter, mark)
      }
    })
  }

  return best
}

/** Which try found the word, counted from one, or `null` while none has. */
export const foundOnTryOf = (rows: readonly LetterMarks[]): number | null => {
  const index = rows.findIndex(isFoundBy)

  return index === -1 ? null : index + 1
}

/** A grid with nothing left to try: the word found, or every try spent on it. */
export const isGridDone = (rows: readonly LetterMarks[]): boolean =>
  foundOnTryOf(rows) !== null || rows.length >= MYSTERY_WORD_TRY_COUNT

/** How close a seat came: the most letters in place on any one of its tries. */
export const mostPlacedOf = (rows: readonly LetterMarks[]): number =>
  Math.max(
    0,
    ...rows.map((marks) => marks.filter((mark) => mark === 'placed').length)
  )
