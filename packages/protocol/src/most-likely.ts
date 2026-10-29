import { z } from 'zod'

import { playerIdSchema } from './identifiers'
import { localeSchema } from './locale'

/**
 * A line in every language the app ships, so a phone set to English at a
 * French table reads its own — the challenge's argument. Public from the first
 * frame: it is the question, and no answer exists before the votes do.
 */
export const mostLikelyLabelsSchema = z.record(
  localeSchema,
  z.string().min(1).max(160)
)

/**
 * How many ballots one seat drew at the reveal. Counts only: who voted for
 * whom is never sent, so a table of family members never has to explain a
 * vote. A seat nobody voted for is absent.
 */
export const mostLikelyCountSchema = z.object({
  playerId: playerIdSchema,
  votes: z.number().int().positive()
})

export type MostLikelyLabels = z.infer<typeof mostLikelyLabelsSchema>
export type MostLikelyCount = z.infer<typeof mostLikelyCountSchema>
