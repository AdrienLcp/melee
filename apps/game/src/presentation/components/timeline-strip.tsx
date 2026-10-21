import type React from 'react'

import type {
  DatedTimelineEvent,
  TimelineEvent
} from '@melee/protocol/timeline'

import { TimelineCard } from './timeline-card'

import './timeline-strip.sass'

type TimelineStripProps = {
  /** Read out as the list's name. */
  'aria-label': string
  /** In the order to lay them down. A dated event prints its year, an undated one the slot it will take. */
  events: readonly (DatedTimelineEvent | TimelineEvent)[]
  /**
   * `dealt` lays the cards down as they came, side by side with no line under
   * them, since that order says nothing; `ordered` strings them along a line,
   * earliest first — the order they happened in, or the one a seat sent.
   */
  layout: 'dealt' | 'ordered'
}

const yearOf = (event: DatedTimelineEvent | TimelineEvent): number | null =>
  'year' in event ? event.year : null

/**
 * A round's events laid on the board: across a screen wide enough to read five
 * cards side by side, down one that is not.
 */
export const TimelineStrip: React.FC<TimelineStripProps> = ({
  'aria-label': ariaLabel,
  events,
  layout
}) => (
  // The box is what turns the line down a narrow screen: a container query
  // reads an ancestor, never the list itself.
  <div className='timeline-strip' data-layout={layout}>
    <ol aria-label={ariaLabel}>
      {events.map((event) => (
        <li key={event.id}>
          <TimelineCard event={event} year={yearOf(event)} />
        </li>
      ))}
    </ol>
  </div>
)
