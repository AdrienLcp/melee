import { describe, expect, it } from 'vitest'

import { TIMELINE_EVENTS_PER_ROUND } from '@melee/protocol/timeline'

import { MIN_YEARS_APART } from '@melee/core/timeline/deal'

import {
  bankedTimelineEvents,
  drawTimelineEvents,
  playedTimelineEventId
} from './timeline-bank'

describe('the timeline bank', () => {
  it('[timeline] parses every row, each id once', () => {
    const ids = bankedTimelineEvents().map(({ id }) => id)

    expect(ids.length).toBeGreaterThan(150)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[timeline] deals an evening of rounds before it runs out', () => {
    const playedIds = new Set<string>()
    let rounds = 0

    for (
      let events = drawTimelineEvents({ playedIds });
      events !== null;
      events = drawTimelineEvents({ playedIds })
    ) {
      expect(events).toHaveLength(TIMELINE_EVENTS_PER_ROUND)

      for (const { id } of events) {
        expect(playedIds.has(playedTimelineEventId(id))).toBe(false)
        playedIds.add(playedTimelineEventId(id))
      }

      const years = events.map(({ year }) => year).toSorted((a, b) => a - b)

      for (const [index, year] of years.slice(1).entries()) {
        expect(year - (years[index] ?? 0)).toBeGreaterThanOrEqual(
          MIN_YEARS_APART
        )
      }

      rounds += 1
    }

    expect(rounds).toBeGreaterThanOrEqual(20)
  })
})
