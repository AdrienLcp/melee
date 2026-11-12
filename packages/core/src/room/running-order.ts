import type { GameSettings } from '@melee/protocol/game'
import {
  type LineUpDeal,
  type RoomSettings,
  RUNNING_ORDER_MAX_ROWS
} from '@melee/protocol/room'

import { modeOfferedBy } from './game-modes'
import { dealsOf, isDealtARow, isInTheDraw } from './line-up-deals'
import { isPlayedOut, nextEntryAt } from './next-game'
import { spacedCycle } from './spaced-cycle'

type Order = RoomSettings['runningOrder']

/**
 * Whether an evening may play its running order again past the last row:
 * several entries, every one of them holding a row. An entry kept to the draw
 * has none, and a repeated order would never reach it.
 */
export const canRepeatTheOrder = ({
  deals,
  lineUp
}: {
  /** The settings' `lineUpDeals`. */
  deals: readonly LineUpDeal[]
  lineUp: readonly GameSettings[]
}): boolean =>
  lineUp.length > 1 && dealsOf({ deals, lineUp }).every(isDealtARow)

/** Whether the rounds past the order's last row play it again rather than being drawn. */
export const repeatsTheOrder = (
  settings: Pick<RoomSettings, 'lineUp' | 'lineUpDeals' | 'repeatsRunningOrder'>
): boolean =>
  settings.repeatsRunningOrder &&
  canRepeatTheOrder({ deals: settings.lineUpDeals, lineUp: settings.lineUp })

/**
 * Which entry the round at `roundAt` is on: its row, or the next row the
 * evening still holds when that one's entry is gone or played out — the
 * planned games close up — or, past the order's end, the order again or a
 * draw.
 *
 * The order played again is its entries as they first came up, resumed after
 * the one just played — so a game the host picked by hand moves the loop on
 * rather than restarting it — and passing over an entry played out. A drawn
 * round is drawn among the entries the host put in the draw (`lineUpDeals`);
 * only an evening with none there draws from them all.
 */
export const scheduledEntryAt = ({
  deals,
  lastAt,
  lineUp,
  order,
  played,
  random,
  repeatsOrder,
  roundAt,
  roundsLeft
}: {
  /** The settings' `lineUpDeals`. */
  deals: readonly LineUpDeal[]
  /** As `nextEntryAt`'s. */
  lastAt: number | null
  lineUp: readonly GameSettings[]
  order: Order
  /** As `nextEntryAt`'s. */
  played: readonly number[]
  /** As `nextEntryAt`'s. */
  random: () => number
  /** The settings' `repeatsRunningOrder`, read only where `canRepeatTheOrder` holds. */
  repeatsOrder: boolean
  /** The round being drawn, counted from 0. */
  roundAt: number
  /** As `nextEntryAt`'s. */
  roundsLeft: number | null
}): number | null => {
  const isOwed = isOwedItsRow({ deals, lineUp, played })
  const placed = order.slice(roundAt).find(isOwed)

  if (placed !== undefined) {
    return placed
  }

  const repeated =
    repeatsOrder && canRepeatTheOrder({ deals, lineUp })
      ? entryAfterInOrder({ isOwed, lastAt, order })
      : undefined

  if (repeated !== undefined) {
    return repeated
  }

  const dealt = dealsOf({ deals, lineUp })
  const openedBefore = order.slice(0, Math.max(0, roundAt - 1))

  return (
    nextEntryAt({
      isDrawable: (at) => isInTheDraw(dealt[at]),
      lastAt,
      lineUp,
      openedBefore,
      played,
      random,
      roundsLeft: null
    }) ??
    nextEntryAt({ lastAt, lineUp, openedBefore, played, random, roundsLeft })
  )
}

/**
 * The settings the next round of an evening opens on. The console deals it
 * as the reveal goes up, and when that frame never lands — a console asleep,
 * reconnecting, or a frame refused — the room is still on the entry just
 * played, and would play it again. Unless the order holds that entry on the
 * next row, which is how a host asks for it back, the next round is dealt here
 * instead, on the settings the room already holds: the console's remembered
 * setup for that game is on the console alone.
 */
export const withNextEntryDealt = ({
  lastAt,
  played,
  random,
  roundAt,
  settings
}: {
  /** The entry the round just played was opened from. */
  lastAt: number | null
  /** As `nextEntryAt`'s. */
  played: readonly number[]
  /** As `nextEntryAt`'s. */
  random: () => number
  /** The round about to open, counted from 0. */
  roundAt: number
  settings: RoomSettings
}): RoomSettings => {
  const { lineUp, lineUpAt, runningOrder, roundCount } = settings

  if (
    lineUp.length < 2 ||
    lastAt === null ||
    lineUpAt !== lastAt ||
    runningOrder[roundAt] === lastAt
  ) {
    return settings
  }

  const drawn = scheduledEntryAt({
    deals: settings.lineUpDeals,
    lastAt,
    lineUp,
    order: runningOrder,
    played,
    random,
    repeatsOrder: settings.repeatsRunningOrder,
    roundAt,
    roundsLeft: roundCount === null ? null : roundCount - roundAt
  })
  const entry = drawn === null ? undefined : lineUp[drawn]

  if (drawn === null || drawn === lastAt || entry === undefined) {
    return settings
  }

  return {
    ...settings,
    game: entry,
    lineUpAt: drawn,
    mode: modeOfferedBy({ game: entry, preferred: settings.mode })
  }
}

const entryAfterInOrder = ({
  isOwed,
  lastAt,
  order
}: {
  isOwed: (row: number | null) => row is number
  lastAt: number | null
  order: Order
}): number | undefined => {
  const cycle = [...new Set(order.filter((row) => row !== null))]
  const after = lastAt === null ? -1 : cycle.indexOf(lastAt)

  return cycle
    .map((_row, step) => cycle[(after + 1 + step) % cycle.length] ?? null)
    .find(isOwed)
}

/**
 * The settings an evening is played again on: its running order kept — the
 * host's, or the one dealt — and the round about to open back on its first
 * row, the answer mode narrowed to that entry's game. An order with no row an
 * entry may take is left empty, for the next frame to deal afresh.
 */
export const rewoundToFirstRow = (settings: RoomSettings): RoomSettings => {
  const { lineUp, lineUpDeals, runningOrder } = settings
  const firstAt = runningOrder.find(
    isOwedItsRow({ deals: lineUpDeals, lineUp, played: [] })
  )
  const entry = firstAt === undefined ? undefined : lineUp[firstAt]

  if (firstAt === undefined || entry === undefined) {
    return { ...settings, runningOrder: [] }
  }

  return {
    ...settings,
    game: entry,
    lineUpAt: firstAt,
    mode: modeOfferedBy({ game: entry, preferred: settings.mode })
  }
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
 * where each entry now is, `null` for one taken out, whose row is left as a
 * hole for `dealtOrder` to close.
 */
export const remappedOrder = ({
  indexAfter,
  order
}: {
  indexAfter: (index: number) => number | null
  order: Order
}): Order => order.map((row) => (row === null ? null : indexAfter(row)))

/**
 * The order with a row for an entry just added at `at`, as the last planned
 * game.
 */
export const orderWithEntryAdded = ({
  at,
  order
}: {
  at: number
  order: Order
}): Order => [...order, at]

/**
 * The order the evening plays: one row per entry still to come, the host's
 * rows first in the host's order, then every entry never played and given no
 * row yet — save one the host put in the draw alone — dealt by `spacedCycle`
 * after the rows before them, each game as far from its last round as its
 * share of the entries allows — and from the first row, which an order played
 * again comes back to after its last (`loops`). A row the evening no longer holds — an entry
 * taken out or played out, a second row for one entry — is dropped, and the
 * list closes up. The round about to open is `drawnAt`'s when it is settled. Every round
 * past the last row is drawn as it comes (`scheduledEntryAt`), and a row past
 * a counted evening's end is never reached, which the console shows the host.
 *
 * Empty for a single entry, which plays every round.
 */
export const dealtOrder = ({
  deals,
  drawnAt,
  lineUp,
  order,
  played,
  random,
  upcoming
}: {
  /** The settings' `lineUpDeals`. */
  deals: readonly LineUpDeal[]
  /** The entry the round about to open is on, or `null` while it is not settled. */
  drawnAt: number | null
  lineUp: readonly GameSettings[]
  order: Order
  /** How many rounds each entry has opened, by index. */
  played: readonly number[]
  /** In `[0, 1)`, as `Math.random`. */
  random: () => number
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
  const isOwed = isOwedItsRow({ deals, lineUp, played })
  const isDrawnHere = (row: number | null, index: number) =>
    index === 0 && drawnAt !== null && row === drawnAt
  const kept = placed
    .slice(upcoming)
    .filter(
      (row, index, rows): row is number =>
        (isDrawnHere(row, index) || isOwed(row)) && rows.indexOf(row) === index
    )
  const dealt = dealsOf({ deals, lineUp })
  const owed = lineUp.flatMap((_entry, at) =>
    (played[at] ?? 0) === 0 && isDealtARow(dealt[at]) && !kept.includes(at)
      ? [at]
      : []
  )
  const before = [
    ...Array.from({ length: upcoming }, (_, at) => placed[at] ?? null),
    ...kept
  ]

  return [
    ...before,
    ...spacedCycle({
      entries: owed,
      lineUp,
      loops: true,
      opened: before,
      random
    })
  ].slice(0, RUNNING_ORDER_MAX_ROWS)
}

const isOwedItsRow =
  ({
    deals,
    lineUp,
    played
  }: {
    deals: readonly LineUpDeal[]
    lineUp: readonly GameSettings[]
    played: readonly number[]
  }) =>
  (row: number | null): row is number => {
    const entry = row === null ? undefined : lineUp[row]

    return (
      row !== null &&
      entry !== undefined &&
      isDealtARow(deals[row]) &&
      !isPlayedOut({ entry, played: played[row] ?? 0 })
    )
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
