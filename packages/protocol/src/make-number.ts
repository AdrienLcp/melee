import { z } from 'zod'

import { playerIdSchema } from './identifiers'

/** How many tiles a make-the-number round deals, every one of them on every screen. */
export const MAKE_NUMBER_TILE_COUNT = 6

/** The most steps a calculation may hold: six tiles merge at most five times. */
export const MAKE_NUMBER_MOST_STEPS = MAKE_NUMBER_TILE_COUNT - 1

/**
 * The target's range. 100 is left out because a 100 tile would make it a
 * round with nothing to do.
 */
export const MAKE_NUMBER_LOWEST_TARGET = 101
export const MAKE_NUMBER_HIGHEST_TARGET = 999

/** One dealt tile: 1 to 10, 25, 50, 75 or 100. Given, not the answer: every screen shows them. */
export const numberTileSchema = z.number().int().min(1).max(100)

export const numberTilesSchema = z
  .array(numberTileSchema)
  .length(MAKE_NUMBER_TILE_COUNT)

export const makeNumberTargetSchema = z
  .number()
  .int()
  .min(MAKE_NUMBER_LOWEST_TARGET)
  .max(MAKE_NUMBER_HIGHEST_TARGET)

export const calculationOperators = [
  'add',
  'subtract',
  'multiply',
  'divide'
] as const

export const calculationOperatorSchema = z.enum(calculationOperators)

/**
 * An operand: 0–5 are the tiles, 6 onward the results of the steps before,
 * in order. The last index a fifth step can reach is the fourth step's result.
 */
export const calculationOperandSchema = z
  .number()
  .int()
  .min(0)
  .max(MAKE_NUMBER_TILE_COUNT + MAKE_NUMBER_MOST_STEPS - 2)

/** Two values merged into their result, which every later step may use as a tile. */
export const calculationStepSchema = z.object({
  left: calculationOperandSchema,
  operator: calculationOperatorSchema,
  right: calculationOperandSchema
})

/**
 * One to five steps, each value used at most once and every result a whole
 * number above zero — checked by the server, since a schema cannot see the
 * values. Its value is its last step's result.
 */
export const calculationSchema = z
  .array(calculationStepSchema)
  .min(1)
  .max(MAKE_NUMBER_MOST_STEPS)

/** What a calculation reaches: a whole number above zero, and far past the target when the tiles are multiplied. */
export const calculationValueSchema = z.number().int().positive()

/** A seat's nearest value, which every screen reads while the calculations are hidden. */
export const seatValueSchema = z.object({
  playerId: playerIdSchema,
  value: calculationValueSchema
})

/** A seat's nearest calculation spelled out, which only the reveal sends. */
export const seatCalculationSchema = z.object({
  playerId: playerIdSchema,
  steps: calculationSchema
})

export type NumberTiles = z.infer<typeof numberTilesSchema>
export type CalculationOperator = z.infer<typeof calculationOperatorSchema>
export type CalculationStep = z.infer<typeof calculationStepSchema>
export type Calculation = z.infer<typeof calculationSchema>
export type SeatValue = z.infer<typeof seatValueSchema>
export type SeatCalculation = z.infer<typeof seatCalculationSchema>
