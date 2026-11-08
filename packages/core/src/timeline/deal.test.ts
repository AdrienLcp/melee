import { describe, expect, it } from 'vitest'

import {
  dealEvents,
  dealEventsAt,
  EASY_MIN_YEARS_APART,
  earliestFirst,
  MIN_YEARS_APART
} from './deal'

const eventIn = (year: number) => ({ id: `y${year}`, year })

const CENTURY = Array.from({ length: 100 }, (_, index) => eventIn(1900 + index))

const gapsOf = (events: readonly { id: string; year: number }[]): number[] => {
  const years = earliestFirst(events).map(({ year }) => year)

  return years.slice(1).map((year, index) => year - (years[index] ?? 0))
}

/** Every tenth year is one a child has heard of. */
const KNOWN_EVERY_DECADE = CENTURY.map((event) => ({
  ...event,
  knownToChildren: event.year % 10 === 0
}))

describe('dealing a round of events', () => {
  it('[timeline] deals events far enough apart to be ordered', () => {
    for (let draw = 0; draw < 50; draw += 1) {
      const dealt = dealEvents({
        count: 5,
        events: CENTURY,
        playedIds: new Set()
      })

      expect(dealt).toHaveLength(5)

      const years = earliestFirst(dealt ?? []).map(({ year }) => year)

      for (const [index, year] of years.slice(1).entries()) {
        expect(year - (years[index] ?? 0)).toBeGreaterThanOrEqual(
          MIN_YEARS_APART
        )
      }
    }
  })

  it('[timeline] never deals an event the room has had', () => {
    const playedIds = new Set(CENTURY.slice(0, 95).map(({ id }) => id))

    expect(
      dealEvents({ count: 1, events: CENTURY, playedIds })?.[0]?.id
    ).toMatch(/^y199[5-9]$/)
  })

  it('[timeline] deals an easy round from well-known events a generation apart', () => {
    for (let draw = 0; draw < 50; draw += 1) {
      const dealt = dealEventsAt({
        count: 2,
        difficulty: 'easy',
        events: KNOWN_EVERY_DECADE,
        playedIds: new Set()
      })

      expect(dealt?.every(({ knownToChildren }) => knownToChildren)).toBe(true)
      expect(Math.min(...gapsOf(dealt ?? []))).toBeGreaterThanOrEqual(
        EASY_MIN_YEARS_APART
      )
    }
  })

  it('[timeline] falls back to any event once the well-known ones run out', () => {
    const playedIds = new Set(
      KNOWN_EVERY_DECADE.filter(({ knownToChildren }) => knownToChildren).map(
        ({ id }) => id
      )
    )

    expect(
      dealEventsAt({
        count: 3,
        difficulty: 'easy',
        events: KNOWN_EVERY_DECADE,
        playedIds
      })
    ).toHaveLength(3)
  })

  it('[timeline] keeps the usual spacing for a mixed or hard round', () => {
    const decade = KNOWN_EVERY_DECADE.slice(0, 10)

    for (const difficulty of ['mixed', 'hard'] as const) {
      expect(
        dealEventsAt({
          count: 2,
          difficulty,
          events: decade,
          playedIds: new Set()
        })
      ).toHaveLength(2)
    }
  })

  it('[timeline] gives up once the bank cannot deal that many apart', () => {
    const decade = CENTURY.slice(0, 10)

    expect(
      dealEvents({ count: 3, events: decade, playedIds: new Set() })
    ).toBeNull()
  })
})
