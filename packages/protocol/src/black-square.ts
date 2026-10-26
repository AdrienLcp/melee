import { z } from 'zod'

import { playerIdSchema } from './identifiers'
import { localeSchema } from './locale'

/** The most answers a round deals, which is what the bank holds per theme; it refuses a theme that cannot field them. */
export const BLACK_SQUARE_CELL_COUNT = 9

/** The fewest answers a host may ask a round for: under three, the thirds that price a cell no longer exist. */
export const BLACK_SQUARE_MIN_ANSWER_COUNT = 3

/** How many answers a round deals, the theme's most read first. */
export const blackSquareAnswerCountSchema = z
  .number()
  .int()
  .min(BLACK_SQUARE_MIN_ANSWER_COUNT)
  .max(BLACK_SQUARE_CELL_COUNT)

/** The answers a round dealt, in any shape a screen reads them. */
export const dealtAnswersOf = <Answer extends z.ZodType>(answer: Answer) =>
  z
    .array(answer)
    .min(BLACK_SQUARE_MIN_ANSWER_COUNT)
    .max(BLACK_SQUARE_CELL_COUNT)

/**
 * Where an answer sits on the grid, 0-based, and its rank: cell 0 is the most
 * read of those dealt and the last cell the least. A seat is sent the cells it found and
 * never the text of one it did not type.
 */
export const blackSquareCellSchema = z
  .number()
  .int()
  .min(0)
  .max(BLACK_SQUARE_CELL_COUNT - 1)

/** How obscure a cell is, which is what it pays in `POINT`s: the most read third 1, the least read third 3. */
export const blackSquareTierSchema = z.number().int().min(1).max(3)

/** A theme, an answer or the black word, in every language the app ships. */
export const blackSquareLabelsSchema = z.record(
  localeSchema,
  z.string().min(1).max(200)
)

const namedSchema = z.object({
  /** Every other name a table may type for it, per language. */
  aliases: z.record(localeSchema, z.array(z.string().min(1).max(200))),
  labels: blackSquareLabelsSchema
})

/**
 * A round's whole secret, as the server holds it: the answers dealt, most read first,
 * and the one answer that sounds right and is not. Only ever a host's while the
 * console holds no seat, and projected without its aliases even then.
 */
export const blackSquareThemeSchema = z.object({
  answers: dealtAnswersOf(namedSchema),
  blackWord: namedSchema.extend({
    /** Why it is wrong, one line for the reveal. */
    why: blackSquareLabelsSchema
  }),
  labels: blackSquareLabelsSchema
})

/** An answer as a screen that may read it shows it: its name and what it pays. */
export const blackSquareAnswerSchema = z.object({
  labels: blackSquareLabelsSchema,
  tier: blackSquareTierSchema
})

export const blackSquareBlackWordSchema = z.object({
  labels: blackSquareLabelsSchema,
  why: blackSquareLabelsSchema
})

/**
 * A line a seat sent and what it found: the cells it lit, none for a miss, and
 * whether it was the black word. The seat's own words, read back to it alone,
 * so its grid prints what it typed and survives a reload.
 */
export const blackSquareSentLineSchema = z.object({
  cells: z.array(blackSquareCellSchema).max(BLACK_SQUARE_CELL_COUNT),
  hitBlackWord: z.boolean(),
  line: z.string().min(1).max(120)
})

/**
 * How many lines a seat is read back: every one that found something — nine
 * cells and the black word at most — and the latest, when it found nothing.
 */
export const BLACK_SQUARE_LINES_READ_BACK = BLACK_SQUARE_CELL_COUNT + 2

/** The grid once the round is over: every answer, who found it, and who fell on the black word. */
export const revealedBlackSquareSchema = z.object({
  answers: dealtAnswersOf(
    blackSquareAnswerSchema.extend({ foundBy: z.array(playerIdSchema) })
  ),
  blackWord: blackSquareBlackWordSchema.extend({
    hitBy: z.array(playerIdSchema)
  }),
  /** Whether this round paid a cell found by one seat alone double, as it was opened. */
  doublesLoneFinds: z.boolean()
})

export type BlackSquareCell = z.infer<typeof blackSquareCellSchema>
export type BlackSquareAnswerCount = z.infer<
  typeof blackSquareAnswerCountSchema
>
export type BlackSquareTier = z.infer<typeof blackSquareTierSchema>
export type BlackSquareLabels = z.infer<typeof blackSquareLabelsSchema>
export type BlackSquareTheme = z.infer<typeof blackSquareThemeSchema>
export type BlackSquareAnswer = z.infer<typeof blackSquareAnswerSchema>
export type BlackSquareSentLine = z.infer<typeof blackSquareSentLineSchema>
export type BlackSquareBlackWord = z.infer<typeof blackSquareBlackWordSchema>
export type RevealedBlackSquare = z.infer<typeof revealedBlackSquareSchema>
