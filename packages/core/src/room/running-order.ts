import type { GameSettings } from '@melee/protocol/game'
import { type RoomSettings, RUNNING_ORDER_MAX_ROWS } from '@melee/protocol/room'

import { capabilitiesOf } from './game-capabilities'
import { isPlayedOut, nextEntryAt } from './next-game'

type Order = RoomSettings['runningOrder']

/**
 * Which entry the round at `roundAt` is on: its row, or a draw. A row whose
 * entry is gone or played out is drawn, and so is every round past the order's
 * end.
 *
 * Such a round is drawn among the entries that serve their own content, since
 * every entry the host brings has a row of its own further down; only an
 * evening with none of those draws from the rest.
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
  order: Order
  /** As `nextEntryAt`'s. */
  played: readonly number[]
  /** As `nextEntryAt`'s. */
  random: () => number
  /** The round being drawn, counted from 0. */
  roundAt: number
  /** As `nextEntryAt`'s. */
  roundsLeft: number | null
}): number | null => {
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
  order: Order
}): boolean => order.every((row) => row === null || row < lineUp.length)

/**
 * The order with the line-up's indices moved by an edit: `indexAfter` says
 * where each entry now is, `null` for one taken out, whose rows are left as
 * holes for `dealtOrder` rather than dropped — the evening keeps its length.
 */
export const remappedOrder = ({
  indexAfter,
  order
}: {
  indexAfter: (index: number) => number | null
  order: Order
}): Order => order.map((row) => (row === null ? null : indexAfter(row)))

/**
 * The order with a row for an entry just added at `at`, as the last round.
 * Past a count already full, `dealtOrder` then gives up a round of a game
 * that serves its own content to make room for it.
 */
export const orderWithEntryAdded = ({
  at,
  order
}: {
  at: number
  order: Order
}): Order => [...order, at]

/**
 * The order the evening plays, dealt by `nextEntryAt`'s rule: every row the
 * host left stands, and every hole — a round added to the count, an entry taken
 * out, a skip — is drawn as if the rounds before it had played. The round
 * about to open is `drawnAt`'s when it is settled, and every entry still owed
 * a round has one: past a counted evening's end only when the count is too
 * short for every entry the host brought, which the console then offers to
 * raise. Rows over the count are given up from the end, a round of a game
 * serving its own content that has another one; an evening with no count holds
 * one round per entry still in the deck, and draws the rest as they come.
 *
 * Empty for a single entry, which plays every round.
 */
export const dealtOrder = ({
  drawnAt,
  lineUp,
  order,
  played,
  random,
  roundCount,
  upcoming
}: {
  /** The entry the round about to open is on, or `null` while it is not settled. */
  drawnAt: number | null
  lineUp: readonly GameSettings[]
  order: Order
  /** How many rounds each entry has opened, by index. */
  played: readonly number[]
  /** In `[0, 1)`, as `Math.random`. */
  random: () => number
  roundCount: number | null
  /** The round about to open, counted from 0. */
  upcoming: number
}): Order => {
  if (lineUp.length < 2) {
    return []
  }

  const placed =
    drawnAt === null
      ? order
      : orderWithEntryNext({ at: drawnAt, order, upcoming })
  const isLeftToDeal = (row: number | null) => {
    const entry = row === null ? undefined : lineUp[row]

    return (
      row !== null &&
      entry !== undefined &&
      !isPlayedOut({ entry, played: played[row] ?? 0 })
    )
  }
  const inDeck = lineUp.flatMap((_entry, at) => (isLeftToDeal(at) ? [at] : []))
  const isRepeatable = (row: number) => {
    const entry = lineUp[row]

    return entry !== undefined && capabilitiesOf(entry.kind).servesItsOwnContent
  }
  const kept = placed
    .slice(upcoming)
    .map((row, index, rows) =>
      row !== null &&
      isLeftToDeal(row) &&
      (isRepeatable(row) || rows.indexOf(row) === index)
        ? row
        : null
    )
  const length =
    roundCount === null
      ? Math.max(kept.length, inDeck.length)
      : Math.max(kept.length, roundCount - upcoming)
  const dealt = withHolesDealt({
    lastAt: placed[upcoming - 1] ?? null,
    lineUp,
    played,
    random,
    rows: Array.from({ length }, (_, at) => kept[at] ?? null)
  })
  const owed = inDeck.filter(
    (at) => (played[at] ?? 0) === 0 && !dealt.includes(at)
  )
  const coming = withRowsOverTheCountGivenUp({
    isNextSettled: drawnAt !== null,
    lineUp,
    played,
    rows: [...dealt, ...owed],
    target: roundCount === null ? null : roundCount - upcoming
  })

  return [
    ...Array.from({ length: upcoming }, (_, at) => placed[at] ?? null),
    ...coming
  ].slice(0, RUNNING_ORDER_MAX_ROWS)
}

const withHolesDealt = ({
  lastAt,
  lineUp,
  played,
  random,
  rows
}: {
  lastAt: number | null
  lineUp: readonly GameSettings[]
  played: readonly number[]
  random: () => number
  rows: readonly (number | null)[]
}): number[] => {
  const planned = lineUp.map((_entry, at) => played[at] ?? 0)

  for (const row of rows) {
    if (row !== null) {
      planned[row] = (planned[row] ?? 0) + 1
    }
  }

  const dealt: number[] = []
  let holesLeft = rows.filter((row) => row === null).length

  for (const row of rows) {
    if (row !== null) {
      dealt.push(row)
      continue
    }

    const drawn = nextEntryAt({
      lastAt: dealt.at(-1) ?? lastAt,
      lineUp,
      played: planned,
      random,
      roundsLeft: holesLeft
    })

    holesLeft -= 1

    if (drawn !== null) {
      dealt.push(drawn)
      planned[drawn] = (planned[drawn] ?? 0) + 1
    }
  }

  return dealt
}

const withRowsOverTheCountGivenUp = ({
  isNextSettled,
  lineUp,
  played,
  rows,
  target
}: {
  /** The first row is the round already drawn, and stays. */
  isNextSettled: boolean
  lineUp: readonly GameSettings[]
  played: readonly number[]
  rows: readonly number[]
  target: number | null
}): number[] => {
  const kept = [...rows]
  const isSpare = (row: number, index: number) => {
    const entry = lineUp[row]

    return (
      (index > 0 || !isNextSettled) &&
      entry !== undefined &&
      capabilitiesOf(entry.kind).servesItsOwnContent &&
      ((played[row] ?? 0) > 0 ||
        kept.some((other, at) => at !== index && other === row))
    )
  }

  while (target !== null && kept.length > Math.max(0, target)) {
    const spare = kept.findLastIndex(isSpare)

    if (spare === -1) {
      break
    }

    kept.splice(spare, 1)
  }

  return kept
}

/** One round still to come. */
export type ComingRound = {
  /** The entry it plays. */
  at: number
  /** The round after the count's last: its entry is never reached. */
  isPastTheEnd: boolean
  /** Which round of the evening it is, counted from 0. */
  roundAt: number
}

/**
 * The rounds still to come, from the one about to open. Once that one is drawn
 * it plays the entry it was drawn on, whatever its row says. A row past the
 * count holds an entry the host brought, which the host has to see to bring
 * back.
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
  const end = Math.max(order.length, drawnAt === null ? 0 : upcoming + 1)

  return Array.from({ length: Math.max(0, end - upcoming) }, (_, offset) => {
    const roundAt = upcoming + offset

    return {
      at: (offset === 0 ? drawnAt : null) ?? order[roundAt] ?? null,
      roundAt
    }
  }).flatMap(({ at, roundAt }) =>
    at === null
      ? []
      : [
          {
            at,
            isPastTheEnd: roundCount !== null && roundAt >= roundCount,
            roundAt
          }
        ]
  )
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
 * was there takes its next row, or the first hole after it, so putting one
 * first never leaves another without a round.
 */
export const orderWithEntryNext = ({
  at,
  order,
  upcoming
}: {
  at: number
  order: Order
  /** The round about to open, counted from 0. */
  upcoming: number
}): Order => {
  if (order[upcoming] === at) {
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
