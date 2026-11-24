import { describe, expect, it } from 'vitest'

import { difficulties } from '@melee/protocol/difficulty'
import { TIMELINE_EVENTS_PER_ROUND } from '@melee/protocol/timeline'

import {
  EASY_MIN_YEARS_APART,
  MIN_YEARS_APART
} from '@melee/core/timeline/deal'

import {
  bankedTimelineEvents,
  drawTimelineEvents,
  playedTimelineEventId
} from './timeline-bank'
import bank from './timeline-bank.json' with { type: 'json' }

const homeCountryOf = new Map(
  bankedTimelineEvents().map(({ homeCountry, id }) => [id, homeCountry])
)

describe('the timeline bank', () => {
  it('[timeline] parses every row, each id once', () => {
    const ids = bankedTimelineEvents().map(({ id }) => id)

    expect(ids.length).toBeGreaterThan(150)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[timeline] writes every event in Portuguese ahead of the locale, never its year', () => {
    expect(
      bank
        .filter(
          ({ labels, year }) =>
            labels.pt.trim() === '' || labels.pt.includes(String(year))
        )
        .map(({ id }) => id)
    ).toEqual([])
  })

  it.each(difficulties)(
    '[timeline] deals a table with no country of its own an evening of %s rounds before it runs out',
    (difficulty) => {
      const playedIds = new Set<string>()
      let rounds = 0

      for (
        let events = drawTimelineEvents({
          difficulty,
          homeCountry: null,
          playedIds
        });
        events !== null;
        events = drawTimelineEvents({
          difficulty,
          homeCountry: null,
          playedIds
        })
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
    }
  )

  it('[timeline] deals a table of children several rounds of events it knows', () => {
    const knownIds = new Set(
      bankedTimelineEvents()
        .filter(({ knownToChildren }) => knownToChildren)
        .map(({ id }) => id)
    )
    const playedIds = new Set<string>()

    for (let round = 0; round < 5; round += 1) {
      const events =
        drawTimelineEvents({
          difficulty: 'easy',
          homeCountry: 'FRA',
          playedIds
        }) ?? []
      const years = events.map(({ year }) => year).toSorted((a, b) => a - b)

      expect(events.every(({ id }) => knownIds.has(id))).toBe(true)

      for (const [index, year] of years.slice(1).entries()) {
        expect(year - (years[index] ?? 0)).toBeGreaterThanOrEqual(
          EASY_MIN_YEARS_APART
        )
      }

      for (const { id } of events) {
        playedIds.add(playedTimelineEventId(id))
      }
    }
  })

  it.each([
    { dealt: [null], homeCountry: 'PRT' },
    { dealt: [null, 'FRA'], homeCountry: 'FRA' },
    { dealt: [null], homeCountry: null }
  ] as const)(
    "[timeline] deals a table of $homeCountry everyone's events and its own, never another country's",
    ({ dealt, homeCountry }) => {
      const homes = new Set(
        Array.from({ length: 200 }, () =>
          drawTimelineEvents({
            difficulty: 'mixed',
            homeCountry,
            playedIds: new Set()
          })
        ).flatMap((events) =>
          (events ?? []).map(({ id }) => homeCountryOf.get(id))
        )
      )

      expect(homes).toEqual(new Set(dealt))
    }
  )

  it('[timeline] keeps a French date to the French table, and a date the world knows to every table', () => {
    expect(homeCountryOf.get('veil-law')).toBe('FRA')
    expect(homeCountryOf.get('mitterrand-elected')).toBe('FRA')
    expect(homeCountryOf.get('bastille')).toBeNull()
    expect(homeCountryOf.get('france-world-cup-1998')).toBeNull()
  })
})
