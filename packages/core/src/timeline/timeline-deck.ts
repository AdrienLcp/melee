import type { TimelineDeckItem } from '@melee/protocol/deck'
import { TIMELINE_EVENTS_PER_ROUND } from '@melee/protocol/timeline'

import { normalizeAnswer } from '../round/answer-matching'
import { dealDeckEvents } from './deal'

/**
 * Everything wrong with a timeline deck, each problem led by its path: two
 * events in one year, whose true order is a coin toss, an event given twice,
 * and a deck the dealer could not deal a first round from. Empty when the
 * deck holds.
 */
export const timelineDeckProblems = ({
  items,
  path
}: {
  items: readonly TimelineDeckItem[]
  path: string
}): string[] => {
  const years = items.map(({ year }) => year)
  const labels = items.map(({ label }) => normalizeAnswer(label))
  const tied = items.flatMap(({ year }, index) => {
    const first = years.indexOf(year)

    return first < index
      ? [
          `${path}.items[${index}].year: ${year} is items[${first}]'s year too — two events of one year have no true order.`
        ]
      : []
  })
  const repeated = items.flatMap(({ label }, index) =>
    labels.indexOf(labels[index] ?? '') < index
      ? [`${path}.items[${index}].label: “${label}” is another event again.`]
      : []
  )
  const dealsARound =
    dealDeckEvents({
      count: TIMELINE_EVENTS_PER_ROUND,
      events: items.map(({ year }, index) => ({ id: String(index), year })),
      playedIds: new Set()
    }) !== null

  return [
    ...tied,
    ...repeated,
    ...(tied.length > 0 || dealsARound
      ? []
      : [
          `${path}.items: a round deals ${TIMELINE_EVENTS_PER_ROUND} events of distinct years, and this deck cannot.`
        ])
  ]
}
