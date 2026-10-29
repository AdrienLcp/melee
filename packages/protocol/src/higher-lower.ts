import { z } from 'zod'

import { quantityFamilySchema } from './estimate'
import { playerIdSchema } from './identifiers'
import { localeSchema } from './locale'

/**
 * Five rather than one, because a single pair is a coin flip: five turn luck
 * into a score, and the reveal of ten numbers is where the table argues.
 */
export const HIGHER_LOWER_PAIR_COUNT = 5

export const higherLowerSideSchema = z.enum(['left', 'right'])

/**
 * One pick per pair, in the order the pairs were dealt. Sent whole once the
 * fifth is picked: the screen only moves forward, so a pick is final before
 * the server ever sees it.
 */
export const higherLowerPicksSchema = z
  .array(higherLowerSideSchema)
  .length(HIGHER_LOWER_PAIR_COUNT)

const quantityNamesSchema = z.record(localeSchema, z.string().min(1))

/**
 * Two things of one family as every screen draws them, the name of each in
 * every language the app ships. The values are not here — they arrive with the
 * reveal, which is rule one — and which side is higher is dealt at random.
 */
export const higherLowerPairSchema = z.object({
  family: quantityFamilySchema,
  left: quantityNamesSchema,
  right: quantityNamesSchema
})

/** A pair with both values, in the family's unit: the reveal's, or a console that holds no seat. */
export const valuedHigherLowerPairSchema = higherLowerPairSchema.extend({
  leftValue: z.number().positive(),
  rightValue: z.number().positive()
})

/** The sheet one seat sent. Hidden until the reveal, like every pick. */
export const sentHigherLowerSheetSchema = z.object({
  picks: higherLowerPicksSchema,
  playerId: playerIdSchema
})

export type HigherLowerSide = z.infer<typeof higherLowerSideSchema>
export type HigherLowerPicks = z.infer<typeof higherLowerPicksSchema>
export type HigherLowerPair = z.infer<typeof higherLowerPairSchema>
export type ValuedHigherLowerPair = z.infer<typeof valuedHigherLowerPairSchema>
export type SentHigherLowerSheet = z.infer<typeof sentHigherLowerSheetSchema>
