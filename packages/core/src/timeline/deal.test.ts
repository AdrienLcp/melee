import { describe, expect, it } from 'vitest'

import { dealEvents, earliestFirst, MIN_YEARS_APART } from './deal'

const eventIn = (year: number) => ({ id: `y${year}`, year })

const CENTURY = Array.from({ length: 100 }, (_, index) => eventIn(1900 + index))

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

  it('[timeline] gives up once the bank cannot deal that many apart', () => {
    const decade = CENTURY.slice(0, 10)

    expect(
      dealEvents({ count: 3, events: decade, playedIds: new Set() })
    ).toBeNull()
  })
})
