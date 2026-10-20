import { z } from 'zod'

import { scoreTargetSchema } from './team'

/**
 * What the host says the challenge is, read off the wall across a room —
 * *stack the most raclette potatoes* — and not a set of rules.
 */
export const CHALLENGE_TEXT_MAX_LENGTH = 140

export const challengeTextSchema = z
  .string()
  .trim()
  .max(CHALLENGE_TEXT_MAX_LENGTH)

export const challengePlaces = [1, 2, 3] as const

/** First, second or third. Two finishers may share one; everyone unplaced is paid nought. */
export const challengePlaceSchema = z.literal(challengePlaces)

/**
 * Who finished where. A team in a room playing in teams, a seat in one that is
 * not — the same target `host.adjustScore` names.
 */
export const challengeFinisherSchema = z.object({
  place: challengePlaceSchema,
  target: scoreTargetSchema
})

export type ChallengePlace = z.infer<typeof challengePlaceSchema>
export type ChallengeFinisher = z.infer<typeof challengeFinisherSchema>
