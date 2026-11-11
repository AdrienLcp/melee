import { z } from 'zod'

import { playerIdSchema } from './identifiers'

/** How many words a seat may try on one hidden word. A refused try is not one of them. */
export const MYSTERY_WORD_TRY_COUNT = 6

export const MYSTERY_WORD_MIN_LENGTH = 5

export const MYSTERY_WORD_MAX_LENGTH = 8

/** How many letters the hidden word has, the host's to pick; the first of them is on every screen. */
export const mysteryWordLengthSchema = z
  .number()
  .int()
  .min(MYSTERY_WORD_MIN_LENGTH)
  .max(MYSTERY_WORD_MAX_LENGTH)

/**
 * What one letter of a try says about the hidden word: `placed` in that very
 * place, `present` somewhere else in it, `absent` not in it — or not in it
 * as many times as the try wrote it.
 */
export const letterMarkSchema = z.enum(['placed', 'present', 'absent'])

/** One try's marks, a letter each, with none of its letters: what another seat's grid shows. */
export const letterMarksSchema = z
  .array(letterMarkSchema)
  .min(MYSTERY_WORD_MIN_LENGTH)
  .max(MYSTERY_WORD_MAX_LENGTH)

/**
 * One line a seat types, folded and checked by the server: a word of the
 * length, starting with the given letter, in the round's dictionary. Long
 * enough for a word typed with its accents and a stray space.
 */
export const wordGuessSchema = z.string().min(1).max(40)

/** A try with its letters, folded to `A`–`Z`: the reader's own, or anyone's once revealed. */
export const spelledTrySchema = z.object({
  marks: letterMarksSchema,
  word: z.string().min(MYSTERY_WORD_MIN_LENGTH).max(MYSTERY_WORD_MAX_LENGTH)
})

/** A seat's grid as every screen draws it while the word is hidden: colours, no letter. */
export const colouredGridSchema = z.object({
  playerId: playerIdSchema,
  rows: z.array(letterMarksSchema).max(MYSTERY_WORD_TRY_COUNT)
})

/** A seat's grid spelled out, which only the reveal sends. */
export const spelledGridSchema = z.object({
  playerId: playerIdSchema,
  tries: z.array(spelledTrySchema).max(MYSTERY_WORD_TRY_COUNT)
})

export type LetterMark = z.infer<typeof letterMarkSchema>
export type LetterMarks = z.infer<typeof letterMarksSchema>
export type SpelledTry = z.infer<typeof spelledTrySchema>
export type ColouredGrid = z.infer<typeof colouredGridSchema>
export type SpelledGrid = z.infer<typeof spelledGridSchema>
