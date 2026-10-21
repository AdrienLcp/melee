import { z } from 'zod'

import { localeSchema } from './locale'

/**
 * How many events a round deals. Five is ten pairs to get right, which is
 * enough for a near miss to read as one and few enough to order on a phone
 * without scrolling.
 */
export const TIMELINE_EVENTS_PER_ROUND = 5

export const timelineEventIdSchema = z.string().regex(/^[a-z0-9-]{1,64}$/)

/**
 * What an event is called, in every language the app ships. Every label rides
 * the wire rather than the room's language, so a phone set to English at a
 * French table reads its own. A record keyed on an enum is exhaustive, so a
 * locale added to the app is a label missing from every event until written.
 */
export const timelineLabelsSchema = z.record(
  localeSchema,
  z.string().min(1).max(120)
)

/** An event as every screen holds it while the round is open: a name and no date. */
export const timelineEventSchema = z.object({
  id: timelineEventIdSchema,
  labels: timelineLabelsSchema
})

/** The same event with its year, which is the answer: held back until the reveal. */
export const datedTimelineEventSchema = timelineEventSchema.extend({
  /** Negative before the common era, which the bank does not deal yet. */
  year: z.number().int()
})

/**
 * One seat's answer: every event of the round, earliest first. Sent once, like
 * a pick — reordering is what the screen is for before it is sent.
 */
export const timelineOrderSchema = z
  .array(timelineEventIdSchema)
  .min(2)
  .max(TIMELINE_EVENTS_PER_ROUND)

export type TimelineEventId = z.infer<typeof timelineEventIdSchema>
export type TimelineLabels = z.infer<typeof timelineLabelsSchema>
export type TimelineEvent = z.infer<typeof timelineEventSchema>
export type DatedTimelineEvent = z.infer<typeof datedTimelineEventSchema>
export type TimelineOrder = z.infer<typeof timelineOrderSchema>
