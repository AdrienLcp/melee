import { z } from 'zod'

import { localeSchema } from './locale'
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

/**
 * A ready-made line in every language the app ships. Every label rides the
 * wire rather than the room's language, so a phone set to English at a French
 * table reads its own. A record keyed on an enum is exhaustive, so a locale
 * added to the app is a label missing from every line until written.
 */
export const challengeLabelsSchema = z.record(
  localeSchema,
  z.string().min(1).max(CHALLENGE_TEXT_MAX_LENGTH)
)

/**
 * What a ready-made line asks for, so two rounds in a row can differ: bring
 * something back, do something at the table, or a festive line dealt only when
 * the host asks for one.
 */
export const challengeCategories = ['fetch', 'do', 'festive'] as const

export const challengeCategorySchema = z.enum(challengeCategories)

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

export type ChallengeLabels = z.infer<typeof challengeLabelsSchema>
export type ChallengeCategory = z.infer<typeof challengeCategorySchema>
export type ChallengePlace = z.infer<typeof challengePlaceSchema>
export type ChallengeFinisher = z.infer<typeof challengeFinisherSchema>
