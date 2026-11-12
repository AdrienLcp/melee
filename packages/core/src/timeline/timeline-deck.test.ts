import { describe, expect, it } from 'vitest'

import type { TimelineDeckItem } from '@melee/protocol/deck'

import { dealDeckEvents } from './deal'
import { timelineDeckProblems } from './timeline-deck'

const FAMILY: TimelineDeckItem[] = [
  { label: 'Grandpa and Grandma marry', year: 1968 },
  { label: 'Mum is born', year: 1972 },
  { label: 'The house in Cholet', year: 1999 },
  { label: 'Léa is born', year: 2015 },
  { label: 'Tom is born', year: 2017 },
  { label: 'The dog joins us', year: 2019 }
]

const datedEvents = (items: readonly TimelineDeckItem[]) =>
  items.map(({ year }, index) => ({ id: String(index), year }))

describe('timelineDeckProblems', () => {
  it('[timeline] finds nothing in a family deck two years apart', () => {
    expect(timelineDeckProblems({ items: FAMILY, path: 'decks[0]' })).toEqual(
      []
    )
  })

  it('[timeline] refuses two events of one year', () => {
    expect(
      timelineDeckProblems({
        items: [...FAMILY, { label: 'The first car', year: 2015 }],
        path: 'decks[0]'
      })
    ).toEqual([
      "decks[0].items[6].year: 2015 is items[3]'s year too — two events of one year have no true order."
    ])
  })

  it('[timeline] refuses an event given twice, whatever its case', () => {
    expect(
      timelineDeckProblems({
        items: [...FAMILY, { label: 'léa is BORN', year: 2021 }],
        path: 'decks[2]'
      })
    ).toEqual([
      'decks[2].items[6].label: “léa is BORN” is another event again.'
    ])
  })
})

describe('dealDeckEvents', () => {
  it('[timeline] deals a deck by distinct years, closer than the bank allows', () => {
    const dealt = dealDeckEvents({
      count: 5,
      events: datedEvents(FAMILY.slice(0, 5)),
      playedIds: new Set()
    })

    expect(dealt?.map(({ year }) => year).toSorted()).toEqual([
      1968, 1972, 1999, 2015, 2017
    ])
  })

  it('[timeline] fills the last round with dates already ordered, every unplayed one in it', () => {
    const events = datedEvents(FAMILY)
    const played = new Set(['0', '1', '2', '3'])
    const dealt = dealDeckEvents({ count: 5, events, playedIds: played })

    expect(dealt).toHaveLength(5)
    expect(
      dealt?.filter(({ id }) => !played.has(id)).map(({ id }) => id)
    ).toEqual(['4', '5'])
    expect(new Set(dealt?.map(({ id }) => id)).size).toBe(5)
  })

  it('[timeline] deals nothing once every event has been dealt', () => {
    const events = datedEvents(FAMILY)

    expect(
      dealDeckEvents({
        count: 5,
        events,
        playedIds: new Set(events.map(({ id }) => id))
      })
    ).toBeNull()
  })
})
