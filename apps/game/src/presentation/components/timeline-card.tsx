import type React from 'react'

import type { TimelineEvent } from '@melee/protocol/timeline'

import { useI18n } from '@/presentation/i18n/i18n-provider'

import './timeline-card.sass'

type TimelineCardProps = {
  event: TimelineEvent
  /** Printed above the name once the round is revealed; `null` leaves the slot empty, a date still to find. */
  year: number | null
}

/**
 * One event as a printed card: its name in the reader's own language, and the
 * year it happened in the slot above it. Every label rides the wire, so a
 * screen set to another language than the table's still reads its own.
 */
export const TimelineCard: React.FC<TimelineCardProps> = ({ event, year }) => {
  const { locale } = useI18n()

  return (
    <span className='timeline-card' data-dated={year !== null || undefined}>
      <span aria-hidden={year === null || undefined} className='year'>
        {year ?? '?'}
      </span>
      <span className='label'>{event.labels[locale]}</span>
    </span>
  )
}
