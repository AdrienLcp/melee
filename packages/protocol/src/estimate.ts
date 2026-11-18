import { z } from 'zod'

import { playerIdSchema } from './identifiers'
import { localizedSchema } from './locale'
import { silhouetteFileSchema } from './question'

/**
 * What a quantity measures and of what, each one SPARQL query in the bank's
 * build and one sentence in each dictionary. The sentence is the dictionary's
 * rather than the bank's, because French puts an article before most country
 * names and Wikidata's label carries none, and a wording that names the place
 * after a colon needs none.
 */
export const WIKIDATA_QUANTITY_FAMILIES = [
  'area.city',
  'area.country',
  'area.department',
  'area.region',
  'elevation.mountain',
  'height.building',
  'length.river',
  'population.city',
  'population.country',
  'population.department',
  'population.region'
] as const

/**
 * Every family a question is dealt from: Wikidata's, and the prices, written
 * by hand because Wikidata files no price a table could be paid on.
 */
export const QUANTITY_FAMILIES = [
  ...WIKIDATA_QUANTITY_FAMILIES,
  'price.item'
] as const

export const wikidataQuantityFamilySchema = z.enum(WIKIDATA_QUANTITY_FAMILIES)

export const quantityFamilySchema = z.enum(QUANTITY_FAMILIES)

/**
 * What a guess is counted in, shown beside the field so nobody loses a round
 * to metres against kilometres.
 */
export const QUANTITY_UNITS = [
  'euros',
  'kilometres',
  'metres',
  'people',
  'squareKilometres'
] as const

export const quantityUnitSchema = z.enum(QUANTITY_UNITS)

export const UNIT_OF_FAMILY = {
  'area.city': 'squareKilometres',
  'area.country': 'squareKilometres',
  'area.department': 'squareKilometres',
  'area.region': 'squareKilometres',
  'elevation.mountain': 'metres',
  'height.building': 'metres',
  'length.river': 'kilometres',
  'population.city': 'people',
  'population.country': 'people',
  'population.department': 'people',
  'population.region': 'people',
  'price.item': 'euros'
} as const satisfies Record<QuantityFamily, QuantityUnit>

/**
 * What a host ticks to choose the questions: a summit and a tower are both a
 * height in metres, and a table asks for heights, not for Wikidata's families.
 */
export const QUANTITY_TOPICS = [
  'population',
  'area',
  'height',
  'length',
  'price'
] as const

export const quantityTopicSchema = z.enum(QUANTITY_TOPICS)

export const TOPIC_OF_FAMILY = {
  'area.city': 'area',
  'area.country': 'area',
  'area.department': 'area',
  'area.region': 'area',
  'elevation.mountain': 'height',
  'height.building': 'height',
  'length.river': 'length',
  'population.city': 'population',
  'population.country': 'population',
  'population.department': 'population',
  'population.region': 'population',
  'price.item': 'price'
} as const satisfies Record<QuantityFamily, QuantityTopic>

/**
 * Every topic the table ticked, at least one and each once. Each round draws
 * a topic first and a question inside it, so two hundred prices meet as many rounds
 * as two thousand rivers.
 */
export const quantityTopicSetSchema = z
  .array(quantityTopicSchema)
  .min(1)
  .refine((topics) => new Set(topics).size === topics.length)

/** The longest question an evening may ask of a number in its own words. */
export const QUANTITY_PROMPT_MAX_LENGTH = 160

/** The longest unit an evening may count its own number in — _km_, _litres_, _pizzas_. */
export const QUANTITY_UNIT_MAX_LENGTH = 24

/**
 * The words an evening wrote a number in, `null` for a bare count. Free text
 * the dealer took as written, in one language shown in every one.
 */
export const ownQuantityUnitSchema = z
  .string()
  .trim()
  .min(1)
  .max(QUANTITY_UNIT_MAX_LENGTH)
  .nullable()

/**
 * A number asked in an evening's own words: the question as said, and what
 * the answer is counted in. A family's sentence and unit are the dictionary's;
 * these are the deck's.
 */
export const ownQuantityAskSchema = z.object({
  kind: z.literal('own'),
  prompt: z.string().trim().min(1).max(QUANTITY_PROMPT_MAX_LENGTH),
  unit: ownQuantityUnitSchema
})

/** A number asked in a family's words, the sentence and the unit both the dictionary's. */
export const bankQuantityAskSchema = z.object({
  family: quantityFamilySchema,
  kind: z.literal('bank')
})

/**
 * A photograph the app serves under `/pictures/`, named after its own content
 * like a flag, so a frame can never point a screen at another address.
 */
export const pictureFileSchema = z.string().regex(/^[0-9a-f]{12}\.webp$/)

/** The longest side a bundled photograph is resized to. */
export const PICTURE_LONG_SIDE = 640

/**
 * A photograph of what a question measures, with the size it is stored at so
 * a screen lays its frame out before the file arrives.
 */
export const estimatePhotoSchema = z.object({
  file: pictureFileSchema,
  height: z.number().int().positive().max(PICTURE_LONG_SIDE),
  width: z.number().int().positive().max(PICTURE_LONG_SIDE)
})

/**
 * The question as every screen draws it: a family of the bank with the name
 * of what it is measured on in every language the app ships, so a phone set to
 * English at a French table reads its own — or a question an evening brought,
 * in its own words. The value is not here — it arrives with the reveal, which
 * is rule one.
 */
export const estimateQuestionSchema = z.discriminatedUnion('kind', [
  bankQuantityAskSchema.extend({
    names: localizedSchema(z.string().min(1)),
    /**
     * The mountain, the building, the river or the object, public from the
     * first frame because nothing in it states the value; `null` on a row the
     * picture bank has no free photograph for.
     */
    photo: estimatePhotoSchema.nullable(),
    /**
     * The country's outline under a country's population or area, public
     * from the first frame as it is in the map's name round; `null` on every
     * other family and on a country the atlas cannot draw.
     */
    silhouette: silhouetteFileSchema.nullable()
  }),
  ownQuantityAskSchema
])

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
export type WikidataQuantityFamily = z.infer<
  typeof wikidataQuantityFamilySchema
>
export type QuantityTopic = z.infer<typeof quantityTopicSchema>
export type QuantityUnit = z.infer<typeof quantityUnitSchema>
export type EstimatePhoto = z.infer<typeof estimatePhotoSchema>
export type EstimateQuestion = z.infer<typeof estimateQuestionSchema>
export type OwnQuantityAsk = z.infer<typeof ownQuantityAskSchema>
/** What a number is asked as and counted in, whichever game asks it. */
export type QuantityAsk = z.infer<typeof bankQuantityAskSchema> | OwnQuantityAsk
export type SentEstimate = z.infer<typeof sentEstimateSchema>
