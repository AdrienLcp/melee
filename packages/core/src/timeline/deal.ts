import { shuffled } from '../helpers/random'

/**
 * The fewest years between any two events of one round. Closer than this and
 * ordering them is knowing two dates by heart rather than placing them on a
 * timeline, which is not the game a family table sat down to.
 */
export const MIN_YEARS_APART = 5

type Dated = { id: string; year: number }

const isFarEnoughFrom =
  (chosen: readonly Dated[]) =>
  (candidate: Dated): boolean =>
    chosen.every(
      ({ year }) => Math.abs(year - candidate.year) >= MIN_YEARS_APART
    )

/**
 * `count` events nobody in the room has been dealt, each at least
 * `MIN_YEARS_APART` from the others, in a shuffled order that says nothing of
 * the answer. `null` once the bank cannot deal that many any more.
 *
 * Greedy over a shuffle rather than a search: a bank spread over centuries
 * leaves plenty of room, and the draw stays as varied as the shuffle is.
 */
export const dealEvents = <TEvent extends Dated>({
  count,
  events,
  playedIds
}: {
  count: number
  events: readonly TEvent[]
  playedIds: ReadonlySet<string>
}): TEvent[] | null => {
  const chosen: TEvent[] = []

  for (const candidate of shuffled(
    events.filter(({ id }) => !playedIds.has(id))
  )) {
    if (chosen.length === count) {
      break
    }

    if (isFarEnoughFrom(chosen)(candidate)) {
      chosen.push(candidate)
    }
  }

  return chosen.length === count ? chosen : null
}

export const earliestFirst = <TEvent extends Dated>(
  events: readonly TEvent[]
): TEvent[] => events.toSorted((one, other) => one.year - other.year)
