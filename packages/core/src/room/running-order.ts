import type { GameSettings } from '@melee/protocol/game'
import { ROUND_COUNT_MAX, type RoomSettings } from '@melee/protocol/room'

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

type Order = NonNullable<RoomSettings['runningOrder']>

/**
 * The order the switch turns an evening to: the next round on its row, then
 * every other entry still owed a round, once each in the list's order, then
 * chance up to the count. The rounds already opened are left to chance, since
 * nothing reads them again.
 */
export const listedOrder = ({
  lineUp,
  lineUpAt,
  played,
  roundCount,
  upcoming
}: {
  lineUp: readonly GameSettings[]
  lineUpAt: number | null
  /** How many rounds each entry has opened, by index. */
  played: readonly number[]
  roundCount: number | null
  /** The round about to open, counted from 0. */
  upcoming: number
}): Order => {
  const owed = lineUp.flatMap((entry, at) =>
    at === lineUpAt || isPlayedOut({ entry, played: played[at] ?? 0 })
      ? []
      : [at]
  )
  const rows = [
    ...Array.from({ length: upcoming }, () => null),
    ...(lineUpAt === null ? [] : [lineUpAt]),
    ...owed
  ]
  const length = Math.min(
    ROUND_COUNT_MAX,
    Math.max(rows.length, roundCount ?? 0)
  )

  return Array.from({ length }, (_, at) => rows[at] ?? null)
}

/** One round still to come in an ordered evening. */
export type ComingRound = {
  /** The entry it plays, or `null` for a round left to chance. */
  at: number | null
  /** The round after the count's last: its entry is never reached. */
  isPastTheEnd: boolean
  /** Which round of the evening it is, counted from 0. */
  roundAt: number
}

/**
 * The rounds still to come, from the one about to open. Once that one is drawn
 * it plays the entry it was drawn on, whatever its row says. The list stops at
 * the count, save for a row past it that holds an entry, which the host has to
 * see to bring back.
 */
export const comingRounds = ({
  drawnAt,
  order,
  roundCount,
  upcoming
}: {
  /** The entry the round about to open is on, or `null` before it is drawn. */
  drawnAt: number | null
  order: Order
  roundCount: number | null
  /** The round about to open, counted from 0. */
  upcoming: number
}): ComingRound[] => {
  const lastHeld = order.findLastIndex((row) => row !== null)
  const end = Math.max(
    roundCount ?? order.length,
    lastHeld + 1,
    drawnAt === null ? 0 : upcoming + 1
  )

  return Array.from({ length: Math.max(0, end - upcoming) }, (_, offset) => {
    const roundAt = upcoming + offset

    return {
      at: (offset === 0 ? drawnAt : null) ?? order[roundAt] ?? null,
      isPastTheEnd: roundCount !== null && roundAt >= roundCount,
      roundAt
    }
  }).filter((round) => round.at !== null || !round.isPastTheEnd)
}

/** The order with the rounds from `upcoming` on played in `rows`' order. */
export const orderWithComingRounds = ({
  order,
  rows,
  upcoming
}: {
  order: Order
  rows: readonly (number | null)[]
  /** The round about to open, counted from 0. */
  upcoming: number
}): Order => [
  ...Array.from({ length: upcoming }, (_, at) => order[at] ?? null),
  ...rows
]

/**
 * The order with the entry at `at` on the round about to open. The entry that
 * was there takes its next row, or the first round left to chance after it, so
 * putting one first never leaves another without a round.
 */
export const orderWithEntryNext = ({
  at,
  order,
  upcoming
}: {
  at: number
  order: RoomSettings['runningOrder']
  /** The round about to open, counted from 0. */
  upcoming: number
}): RoomSettings['runningOrder'] => {
  if (order === null || order[upcoming] === at) {
    return order
  }

  const displaced = order[upcoming] ?? null
  const laterRow = (isFree: (row: number | null) => boolean) =>
    order.findIndex((row, index) => index > upcoming && isFree(row))
  const ownRow = laterRow((row) => row === at)
  const landing = ownRow === -1 ? laterRow((row) => row === null) : ownRow
  const swapped =
    landing !== -1
      ? order.map((row, index) => (index === landing ? displaced : row))
      : displaced === null
        ? order
        : [...order, displaced]

  return orderWithComingRounds({
    order: swapped,
    rows: [at, ...swapped.slice(upcoming + 1)],
    upcoming
  })
}

/**
 * The order with the row an entry just added was given at its end moved onto
 * the count's last round still left to chance, so a counted evening plays it
 * rather than stopping before it.
 */
export const orderWithLastRowSettled = ({
  order,
  roundCount,
  upcoming
}: {
  order: RoomSettings['runningOrder']
  roundCount: number | null
  /** The round about to open, counted from 0. */
  upcoming: number
}): RoomSettings['runningOrder'] => {
  const added = order?.at(-1)

  if (order === null || added == null || roundCount === null) {
    return order
  }

  const rest = order.slice(0, -1)
  const free = rest.findLastIndex(
    (row, index) => row === null && index > upcoming && index < roundCount
  )

  return free === -1
    ? order
    : rest.map((row, index) => (index === free ? added : row))
}
