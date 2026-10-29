import { z } from 'zod'

import { playerIdSchema } from './identifiers'
import { localeSchema } from './locale'

/**
 * What a quantity measures and of what, each one SPARQL query in the bank's
 * build and one sentence in each dictionary. The sentence is the dictionary's
 * rather than the bank's, because French puts an article before most country
 * names and Wikidata's label carries none, and a wording that names the place
 * after a colon needs none.
 */
export const QUANTITY_FAMILIES = [
  'area.country',
  'elevation.mountain',
  'height.building',
  'length.river',
  'population.city',
  'population.country'
] as const

export const quantityFamilySchema = z.enum(QUANTITY_FAMILIES)

/**
 * What a guess is counted in, shown beside the field so nobody loses a round
 * to metres against kilometres.
 */
export const QUANTITY_UNITS = [
  'kilometres',
  'metres',
  'people',
  'squareKilometres'
] as const

export const quantityUnitSchema = z.enum(QUANTITY_UNITS)

export const UNIT_OF_FAMILY = {
  'area.country': 'squareKilometres',
  'elevation.mountain': 'metres',
  'height.building': 'metres',
  'length.river': 'kilometres',
  'population.city': 'people',
  'population.country': 'people'
} as const satisfies Record<QuantityFamily, QuantityUnit>

/**
 * The question as every screen draws it: what is measured, and the name of
 * what it is measured on in every language the app ships, so a phone set to
 * English at a French table reads its own. The value is not here — it arrives
 * with the reveal, which is rule one.
 */
export const estimateQuestionSchema = z.object({
  family: quantityFamilySchema,
  names: z.record(localeSchema, z.string().min(1))
})

/**
 * The largest guess a field takes: past the world's population by five orders,
 * so no question in the bank comes near it, and short of the digits where a
 * double stops counting units.
 */
export const MAX_ESTIMATE = 1e15

/**
 * A guess is measured by its ratio to the truth, so nought and anything below
 * it are not guesses at all and the schema refuses them.
 */
export const estimateGuessSchema = z.number().positive().max(MAX_ESTIMATE)

/**
 * The guess one seat sent. Hidden until the reveal: a number seen on another
 * screen is an anchor to copy. How far it fell is the award's verdict rather
 * than a field here, so the two cannot disagree.
 */
export const sentEstimateSchema = z.object({
  guess: estimateGuessSchema,
  playerId: playerIdSchema
})

export type QuantityFamily = z.infer<typeof quantityFamilySchema>
export type QuantityUnit = z.infer<typeof quantityUnitSchema>
export type EstimateQuestion = z.infer<typeof estimateQuestionSchema>
export type SentEstimate = z.infer<typeof sentEstimateSchema>
