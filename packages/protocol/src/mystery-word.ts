import { z } from 'zod'

/** How many words a seat may try on one hidden word. A refused try is not one of them. */
export const MYSTERY_WORD_TRY_COUNT = 6

/**
 * What one letter of a try says about the hidden word: `placed` in that very
 * place, `present` somewhere else in it, `absent` not in it — or not in it
 * as many times as the try wrote it.
 */
export const letterMarkSchema = z.enum(['placed', 'present', 'absent'])

export type LetterMark = z.infer<typeof letterMarkSchema>
