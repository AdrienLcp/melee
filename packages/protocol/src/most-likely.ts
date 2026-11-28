import { z } from 'zod'

import { playerIdSchema } from './identifiers'
import { localizedSchema } from './locale'

export const MOST_LIKELY_LINE_MAX_LENGTH = 160

/**
 * A line in every language the app ships, so a phone set to English at a
 * French table reads its own — the challenge's argument. Public from the first
 * frame: it is the question, and no answer exists before the votes do.
 */
export const mostLikelyLabelsSchema = localizedSchema(
  z.string().min(1).max(MOST_LIKELY_LINE_MAX_LENGTH)
)

/**
 * The ballots one seat drew, by who cast them. Sent at the reveal and never
 * before: who voted for whom is the reveal's whole fun — _who picked me?_ —
 * but seen while the box is open it is a vote to follow. A seat nobody voted
 * for is absent.
 */
export const mostLikelyCountSchema = z.object({
  playerId: playerIdSchema,
  /** The seats whose ballot named this one, in the order they were cast. */
  voterIds: z.array(playerIdSchema).min(1)
})

export type MostLikelyLabels = z.infer<typeof mostLikelyLabelsSchema>
export type MostLikelyCount = z.infer<typeof mostLikelyCountSchema>
