import type { GameSettings } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { capabilitiesOf } from './game-capabilities'
import { isPlayedOut, nextEntryAt } from './next-game'

/**
 * Which entry the round at `roundAt` is on: the row the host put there, or a
 * draw. A row whose entry is gone or played out is a round left to chance, and
 * so is every round past the order's end.
 *
 * A round left to chance in an ordered evening is drawn among the entries that
 * serve their own content, since every entry the host brings has a row of its
 * own further down; only an evening with none of those draws from the rest.
 * With no order at all, it is `nextEntryAt`.
 */
export const scheduledEntryAt = ({
  lastAt,
  lineUp,
  order,
  played,
  random,
  roundAt,
  roundsLeft
}: {
  /** As `nextEntryAt`'s. */
  lastAt: number | null
  lineUp: readonly GameSettings[]
  order: RoomSettings['runningOrder']
  /** As `nextEntryAt`'s. */
  played: readonly number[]
  /** As `nextEntryAt`'s. */
  random: () => number
  /** The round being drawn, counted from 0. */
  roundAt: number
  /** As `nextEntryAt`'s. */
  roundsLeft: number | null
}): number | null => {
  if (order === null) {
    return nextEntryAt({ lastAt, lineUp, played, random, roundsLeft })
  }

  const placed = order[roundAt] ?? null
  const placedEntry = placed === null ? undefined : lineUp[placed]

  if (
    placed !== null &&
    placedEntry !== undefined &&
    !isPlayedOut({ entry: placedEntry, played: played[placed] ?? 0 })
  ) {
    return placed
  }

  const withEveryHostEntryPlaced = played.map((times, index) => {
    const entry = lineUp[index]

    return entry === undefined || capabilitiesOf(entry.kind).servesItsOwnContent
      ? times
      : Math.max(times, 1)
  })

  return (
    nextEntryAt({
      lastAt,
      lineUp,
      played: withEveryHostEntryPlaced,
      random,
      roundsLeft: null
    }) ?? nextEntryAt({ lastAt, lineUp, played, random, roundsLeft })
  )
}

/** Whether every row of the order points at an entry of the line-up. */
export const orderHolds = ({
  lineUp,
  order
}: {
  lineUp: readonly GameSettings[]
  order: RoomSettings['runningOrder']
}): boolean =>
  order === null || order.every((row) => row === null || row < lineUp.length)

/**
 * The order with the line-up's indices moved by an edit: `indexAfter` says
 * where each entry now is, `null` for one taken out, whose rows are left to
 * chance rather than dropped — the evening keeps its length.
 */
export const remappedOrder = ({
  indexAfter,
  order
}: {
  indexAfter: (index: number) => number | null
  order: RoomSettings['runningOrder']
}): RoomSettings['runningOrder'] =>
  order === null
    ? null
    : order.map((row) => (row === null ? null : indexAfter(row)))

/** The order with a row for an entry just added at `at`, as the last round. */
export const orderWithEntryAdded = ({
  at,
  order
}: {
  at: number
  order: RoomSettings['runningOrder']
}): RoomSettings['runningOrder'] => (order === null ? null : [...order, at])
