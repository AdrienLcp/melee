import { EVENING_NAME_MAX_LENGTH } from '@melee/protocol/evening'
import type { ShelvedGame } from '@melee/protocol/game'
import type { RoomCode } from '@melee/protocol/identifiers'
import type { Locale } from '@melee/protocol/locale'
import type { LineUpDeal, RoomSettings } from '@melee/protocol/room'

import { defaultDealOf } from './line-up-deals'
import {
  gameOfEntry,
  isOnReadyMade,
  type ReadyMadeLineUpId,
  readyMadeLineUpsFor
} from './ready-made-line-ups'
import type { SavedEvening } from './saved-evening'
import { isShelvedGame } from './shelved-game'

/** How many tables this device remembers having run. */
export const RECENT_TABLES_MAX = 8

/**
 * A line-up as it was played: a saved evening without its name, and without
 * its decks — a table run again from history plays every game's own bank,
 * because the questions an evening brought are kept with the evening alone.
 */
export type PlayedLineUp = Omit<SavedEvening, 'decks' | 'name'>

/** A line-up this device ran at a table, remembered so the host can run it again. */
export type RecentTable = PlayedLineUp & {
  /** When its last round so far was revealed, in epoch milliseconds. */
  playedAt: number
  /** The ready-made line-up it was opened on and still plays, or `null`. */
  readyMade: ReadyMadeLineUpId | null
  roomCode: RoomCode
  /** How many rounds have been revealed at it. */
  roundsPlayed: number
}

/**
 * What a home card shows: a line-up the host saved, with the latest table that
 * played it if one did, or a table played on a line-up nobody saved.
 */
export type HomeLineUp =
  | { evening: SavedEvening; recent: RecentTable | null }
  | { evening: null; recent: RecentTable }

const playedLineUpOf = ({
  lineUp,
  lineUpDeals,
  roundCount,
  runningOrder
}: PlayedLineUp): PlayedLineUp => ({
  lineUp,
  lineUpDeals,
  roundCount,
  runningOrder
})

export const recentTableOf = ({
  now,
  readyMade,
  roomCode,
  roundsPlayed,
  settings
}: {
  now: number
  readyMade: ReadyMadeLineUpId | null
  roomCode: RoomCode
  roundsPlayed: number
  settings: RoomSettings
}): RecentTable => ({
  ...playedLineUpOf(settings),
  playedAt: now,
  readyMade,
  roomCode,
  roundsPlayed
})

const isPlainObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const definedFieldsOf = (value: object): [string, unknown][] =>
  Object.entries(value).filter(([, field]) => field !== undefined)

/** Whether two values read back from JSON say the same, whatever order their keys were written in. */
const isSameValue = (left: unknown, right: unknown): boolean => {
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, at) => isSameValue(item, right[at]))
    )
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftFields = definedFieldsOf(left)
    const rightFields = new Map(definedFieldsOf(right))

    return (
      leftFields.length === rightFields.size &&
      leftFields.every(
        ([key, field]) =>
          rightFields.has(key) && isSameValue(field, rightFields.get(key))
      )
    )
  }

  return left === right
}

/**
 * Each entry's deal with its default spelled out, so a line-up kept before its
 * deals were touched is the one a room dealt the same way.
 */
const dealsSpelledOut = ({
  lineUp,
  lineUpDeals
}: PlayedLineUp): (LineUpDeal | null)[] =>
  lineUp.map(
    (entry, at) =>
      lineUpDeals[at] ??
      (typeof entry === 'string' ? null : defaultDealOf(entry))
  )

/**
 * Whether two line-ups play the same: the same entries set the same way, dealt
 * the same and over as many rounds. The running order is left out, because a
 * room deals one whenever the host leaves it empty.
 */
export const isSameLineUp = ({
  left,
  right
}: {
  left: PlayedLineUp
  right: PlayedLineUp
}): boolean =>
  left.roundCount === right.roundCount &&
  isSameValue(left.lineUp, right.lineUp) &&
  isSameValue(dealsSpelledOut(left), dealsSpelledOut(right))

/**
 * The recent tables with `table` first, in place of any of the same room — a
 * table recorded again as each round goes up — or of the same line-up, which
 * one card on the home page runs either way.
 */
export const withTablePlayed = ({
  recents,
  table
}: {
  recents: readonly RecentTable[]
  table: RecentTable
}): RecentTable[] =>
  [
    table,
    ...recents.filter(
      (recent) =>
        recent.roomCode !== table.roomCode &&
        !isSameLineUp({ left: recent, right: table })
    )
  ].slice(0, RECENT_TABLES_MAX)

/**
 * The recent tables with every table played on `lineUp` taken out: the home
 * page's card for that line-up gone, and nothing else.
 */
export const withoutTablesOf = ({
  lineUp,
  recents
}: {
  lineUp: PlayedLineUp
  recents: readonly RecentTable[]
}): RecentTable[] =>
  recents.filter((recent) => !isSameLineUp({ left: recent, right: lineUp }))

/**
 * The home page's line-ups: every saved one in the order it was saved, each
 * with the latest table that played it, then every table played on a line-up
 * nobody saved, the latest first.
 */
export const homeLineUps = ({
  evenings,
  recents
}: {
  evenings: readonly SavedEvening[]
  recents: readonly RecentTable[]
}): HomeLineUp[] => {
  const latestFirst = recents.toSorted(
    (left, right) => right.playedAt - left.playedAt
  )
  const saved = evenings.map(
    (evening): HomeLineUp => ({
      evening,
      recent:
        latestFirst.find((recent) =>
          isSameLineUp({ left: evening, right: recent })
        ) ?? null
    })
  )
  const unsaved = latestFirst
    .filter(
      (recent) =>
        !evenings.some((evening) =>
          isSameLineUp({ left: evening, right: recent })
        )
    )
    .map((recent): HomeLineUp => ({ evening: null, recent }))

  return [...saved, ...unsaved]
}

/** The evening a recent table is kept as when the host saves it under `name`. */
export const savedEveningOfRecent = ({
  name,
  recent
}: {
  name: string
  recent: RecentTable
}): SavedEvening => ({
  ...playedLineUpOf(recent),
  decks: [],
  name: name.trim().slice(0, EVENING_NAME_MAX_LENGTH)
})

/** The games a line-up plays, once each, in its order: what a room is opened on. */
export const gamesOfPlayedLineUp = (lineUp: PlayedLineUp): ShelvedGame[] => [
  ...new Set(lineUp.lineUp.map(gameOfEntry).filter(isShelvedGame))
]

/**
 * The ready-made line-up a table plays: the one the console loaded, or else
 * the one an earlier record of this room or of this very line-up was opened
 * on — a console reloaded mid-game, or a table reopened from home, has
 * forgotten it. Either holds only while the room still plays that line-up's
 * games, however each is set since.
 */
export const readyMadeOfTable = ({
  loaded,
  locale,
  recents,
  roomCode,
  settings
}: {
  /** The ready-made line-up the console loaded and has not let go of. */
  loaded: ReadyMadeLineUpId | null
  locale: Locale
  recents: readonly RecentTable[]
  roomCode: RoomCode
  settings: RoomSettings
}): ReadyMadeLineUpId | null => {
  const played = playedLineUpOf(settings)
  const remembered =
    recents.find(
      (recent) =>
        recent.roomCode === roomCode ||
        isSameLineUp({ left: recent, right: played })
    )?.readyMade ?? null
  const stillPlayed = readyMadeLineUpsFor(locale).filter((lineUp) =>
    isOnReadyMade({ lineUp, settings })
  )

  return (
    [loaded, remembered].find((id) =>
      stillPlayed.some((lineUp) => lineUp.id === id)
    ) ?? null
  )
}
