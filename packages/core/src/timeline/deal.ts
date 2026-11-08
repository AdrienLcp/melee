import type { Difficulty } from '@melee/protocol/difficulty'

import { shuffled } from '../helpers/random'

/**
 * The fewest years between any two events of one round. Closer than this and
 * ordering them is knowing two dates by heart rather than placing them on a
 * timeline, which is not the game a family table sat down to.
 */
export const MIN_YEARS_APART = 5

/**
 * The fewest years between two events of an `easy` round: a child orders
 * generations, not decades, and knows the Moon landing came after the
 * Titanic without knowing either year.
 */
export const EASY_MIN_YEARS_APART = 30

type Dated = { id: string; year: number }

const isFarEnoughFrom =
  ({
    chosen,
    minYearsApart
  }: {
    chosen: readonly Dated[]
    minYearsApart: number
  }) =>
  (candidate: Dated): boolean =>
    chosen.every(({ year }) => Math.abs(year - candidate.year) >= minYearsApart)

/**
 * `count` events nobody in the room has been dealt, each at least
 * `minYearsApart` from the others, in a shuffled order that says nothing of
 * the answer. `null` once the bank cannot deal that many any more.
 *
 * Greedy over a shuffle rather than a search: a bank spread over centuries
 * leaves plenty of room, and the draw stays as varied as the shuffle is.
 */
export const dealEvents = <TEvent extends Dated>({
  count,
  events,
  minYearsApart = MIN_YEARS_APART,
  playedIds
}: {
  count: number
  events: readonly TEvent[]
  minYearsApart?: number
  playedIds: ReadonlySet<string>
}): TEvent[] | null => {
  const chosen: TEvent[] = []

  for (const candidate of shuffled(
    events.filter(({ id }) => !playedIds.has(id))
  )) {
    if (chosen.length === count) {
      break
    }

    if (isFarEnoughFrom({ chosen, minYearsApart })(candidate)) {
      chosen.push(candidate)
    }
  }

  return chosen.length === count ? chosen : null
}

/**
 * A round at the room's level. `mixed` and `hard` deal the whole bank as the
 * game always has: close events are what the game is, and its difficulty was
 * never in question. `easy` deals the events a child has heard of, thirty
 * years apart; once those run out, any event thirty years apart; then the
 * usual spacing — a level never stalls a deal the bank could serve.
 */
export const dealEventsAt = <
  TEvent extends Dated & { knownToChildren: boolean }
>({
  count,
  difficulty,
  events,
  playedIds
}: {
  count: number
  difficulty: Difficulty
  events: readonly TEvent[]
  playedIds: ReadonlySet<string>
}): TEvent[] | null =>
  difficulty === 'easy'
    ? (dealEvents({
        count,
        events: events.filter(({ knownToChildren }) => knownToChildren),
        minYearsApart: EASY_MIN_YEARS_APART,
        playedIds
      }) ??
      dealEvents({
        count,
        events,
        minYearsApart: EASY_MIN_YEARS_APART,
        playedIds
      }) ??
      dealEvents({ count, events, playedIds }))
    : dealEvents({ count, events, playedIds })

export const earliestFirst = <TEvent extends Dated>(
  events: readonly TEvent[]
): TEvent[] => events.toSorted((one, other) => one.year - other.year)
