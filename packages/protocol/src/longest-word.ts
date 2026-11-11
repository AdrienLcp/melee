import { z } from 'zod'

import { playerIdSchema } from './identifiers'

/** How many letters a longest-word round draws, every one of them on every screen. */
export const LONGEST_WORD_LETTER_COUNT = 9

/** The shortest word a seat may send: a single letter is not a word here. */
export const LONGEST_WORD_MIN_LENGTH = 2

/** One drawn letter, folded to `A`–`Z`. Given, not the answer: every screen shows the draw. */
export const drawnLetterSchema = z.string().regex(/^[A-Z]$/)

export const drawnLettersSchema = z
  .array(drawnLetterSchema)
  .length(LONGEST_WORD_LETTER_COUNT)

/** How many letters a word holds, from the shortest a seat may send to the whole draw. */
export const longestWordLengthSchema = z
  .number()
  .int()
  .min(LONGEST_WORD_MIN_LENGTH)
  .max(LONGEST_WORD_LETTER_COUNT)

/** A word made from the draw, folded to `A`–`Z`. */
export const drawnWordSchema = z
  .string()
  .regex(
    new RegExp(
      `^[A-Z]{${LONGEST_WORD_MIN_LENGTH},${LONGEST_WORD_LETTER_COUNT}}$`
    )
  )

/**
 * One line a seat types, folded and checked by the server: a form of the
 * round's dictionary using each drawn letter at most once. Long enough for a
 * word typed with its accents and a stray space.
 */
export const longestWordGuessSchema = z.string().min(1).max(40)

/** How long a seat's longest word is, which every screen reads while the words are hidden. */
export const seatWordLengthSchema = z.object({
  length: longestWordLengthSchema,
  playerId: playerIdSchema
})

/** A seat's longest word spelled out, which only the reveal sends. */
export const seatWordSchema = z.object({
  playerId: playerIdSchema,
  word: drawnWordSchema
})

export type DrawnWord = z.infer<typeof drawnWordSchema>
export type SeatWordLength = z.infer<typeof seatWordLengthSchema>
export type SeatWord = z.infer<typeof seatWordSchema>
