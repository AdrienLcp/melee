import { z } from 'zod'

import {
  type DatedTimelineEvent,
  datedTimelineEventSchema,
  TIMELINE_EVENTS_PER_ROUND
} from '@melee/protocol/timeline'

import { dealEvents } from '@melee/core/timeline/deal'

import bank from './timeline-bank.json' with { type: 'json' }

/**
 * Written by hand for this game, in both languages at once: an event a family
 * table has heard of, dated to a year nobody argues about — a release by its
 * first anywhere. An event whose year is disputed, a game public one year and
 * finished the next, is left out rather than dated by a coin toss.
 */
const bankedEventSchema = datedTimelineEventSchema.extend({
  /** What the event is about, so the bank's spread can be read at a glance. */
  theme: z.enum([
    'culture',
    'film',
    'history',
    'music',
    'science',
    'sport',
    'tech'
  ])
})

/** Parsed on the first draw, like the quiz's bank, rather than on every cold start. */
let parsed: readonly DatedTimelineEvent[] | null = null

export const bankedTimelineEvents = (): readonly DatedTimelineEvent[] => {
  parsed ??= z
    .array(bankedEventSchema)
    .parse(bank)
    .map(({ id, labels, year }) => ({ id, labels, year }))

  return parsed
}

export const playedTimelineEventId = (id: string): string => `timeline:${id}`

/** A round's events, none the room has been dealt; `null` once the bank cannot deal a round. */
export const drawTimelineEvents = ({
  playedIds
}: {
  playedIds: ReadonlySet<string>
}): DatedTimelineEvent[] | null => {
  const events = bankedTimelineEvents()

  return dealEvents({
    count: TIMELINE_EVENTS_PER_ROUND,
    events,
    playedIds: new Set(
      events
        .filter(({ id }) => playedIds.has(playedTimelineEventId(id)))
        .map(({ id }) => id)
    )
  })
}
