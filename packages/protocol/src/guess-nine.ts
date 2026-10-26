import { z } from 'zod'

import { playerIdSchema } from './identifiers'
import { localeSchema } from './locale'

/** The most answers a round deals, which is what the bank holds per theme; it refuses a theme that cannot field them. */
export const GUESS_NINE_CELL_COUNT = 9

/** The fewest answers a host may ask a round for: under three, the thirds that price a cell no longer exist. */
export const GUESS_NINE_MIN_ANSWER_COUNT = 3

/** How many answers a round deals, the theme's most read first. */
export const guessNineAnswerCountSchema = z
  .number()
  .int()
  .min(GUESS_NINE_MIN_ANSWER_COUNT)
  .max(GUESS_NINE_CELL_COUNT)

/** The answers a round dealt, in any shape a screen reads them. */
export const dealtAnswersOf = <Answer extends z.ZodType>(answer: Answer) =>
  z.array(answer).min(GUESS_NINE_MIN_ANSWER_COUNT).max(GUESS_NINE_CELL_COUNT)

/**
 * Where an answer sits on the grid, 0-based, and its rank: cell 0 is the most
 * read of those dealt and the last cell the least. A seat is sent the cells it found and
 * never the text of one it did not type.
 */
export const guessNineCellSchema = z
  .number()
  .int()
  .min(0)
  .max(GUESS_NINE_CELL_COUNT - 1)

/** How obscure a cell is, which is what it pays in `POINT`s: the most read third 1, the least read third 3. */
export const guessNineTierSchema = z.number().int().min(1).max(3)

/** A theme, an answer or the black word, in every language the app ships. */
export const guessNineLabelsSchema = z.record(
  localeSchema,
  z.string().min(1).max(200)
)

const namedSchema = z.object({
  /** Every other name a table may type for it, per language. */
  aliases: z.record(localeSchema, z.array(z.string().min(1).max(200))),
  labels: guessNineLabelsSchema
})

/**
 * A round's whole secret, as the server holds it: the answers dealt, most read first,
 * and the one answer that sounds right and is not. Only ever a host's while the
 * console holds no seat, and projected without its aliases even then.
 */
export const guessNineThemeSchema = z.object({
  answers: dealtAnswersOf(namedSchema),
  blackWord: namedSchema.extend({
    /** Why it is wrong, one line for the reveal. */
    why: guessNineLabelsSchema
  }),
  labels: guessNineLabelsSchema
})

/** An answer as a screen that may read it shows it: its name and what it pays. */
export const guessNineAnswerSchema = z.object({
  labels: guessNineLabelsSchema,
  tier: guessNineTierSchema
})

export const guessNineBlackWordSchema = z.object({
  labels: guessNineLabelsSchema,
  why: guessNineLabelsSchema
})

/**
 * A line a seat sent and what it found: the cells it lit, none for a miss, and
 * whether it was the black word. The seat's own words, read back to it alone,
 * so its grid prints what it typed and survives a reload.
 */
export const guessNineSentLineSchema = z.object({
  cells: z.array(guessNineCellSchema).max(GUESS_NINE_CELL_COUNT),
  hitBlackWord: z.boolean(),
  line: z.string().min(1).max(120)
})

/**
 * How many lines a seat is read back: every one that found something — nine
 * cells and the black word at most — and the latest, when it found nothing.
 */
export const GUESS_NINE_LINES_READ_BACK = GUESS_NINE_CELL_COUNT + 2

/** The grid once the round is over: every answer, who found it, and who fell on the black word. */
export const revealedGuessNineSchema = z.object({
  answers: dealtAnswersOf(
    guessNineAnswerSchema.extend({ foundBy: z.array(playerIdSchema) })
  ),
  blackWord: guessNineBlackWordSchema.extend({
    hitBy: z.array(playerIdSchema)
  }),
  /** Whether this round paid a cell found by one seat alone double, as it was opened. */
  doublesLoneFinds: z.boolean()
})

export type GuessNineCell = z.infer<typeof guessNineCellSchema>
export type GuessNineAnswerCount = z.infer<typeof guessNineAnswerCountSchema>
export type GuessNineTier = z.infer<typeof guessNineTierSchema>
export type GuessNineLabels = z.infer<typeof guessNineLabelsSchema>
export type GuessNineTheme = z.infer<typeof guessNineThemeSchema>
export type GuessNineAnswer = z.infer<typeof guessNineAnswerSchema>
export type GuessNineSentLine = z.infer<typeof guessNineSentLineSchema>
export type GuessNineBlackWord = z.infer<typeof guessNineBlackWordSchema>
export type RevealedGuessNine = z.infer<typeof revealedGuessNineSchema>
