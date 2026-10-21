import type { OrderVerdict } from '@melee/protocol/scoring'
import type { DatedTimelineEvent } from '@melee/protocol/timeline'

import { shuffled } from '@melee/core/helpers/random'
import { earliestFirst } from '@melee/core/timeline/deal'
import { swappedPairsOf } from '@melee/core/timeline/order-pay'

import type { Round } from '@/domain/room/room'

type TimelineContent = Extract<Round['content'], { kind: 'timeline' }>

/** A round on these events, dealt in an order that says nothing of the answer. */
export const timelineContent = (
  events: readonly DatedTimelineEvent[]
): TimelineContent => ({ events: shuffled(events), kind: 'timeline' })

/**
 * What an order sent for this round is worth, or `null` for one that is not
 * every event of it once.
 */
export const gradeOrder = ({
  content,
  eventIds
}: {
  content: TimelineContent
  eventIds: readonly string[]
}): OrderVerdict | null => {
  const swappedPairs = swappedPairsOf({
    sent: eventIds,
    trueOrder: earliestFirst(content.events).map(({ id }) => id)
  })

  return swappedPairs === null ? null : { kind: 'order', swappedPairs }
}
