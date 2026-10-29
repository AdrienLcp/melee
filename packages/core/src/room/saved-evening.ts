import type { GameKind, GameSettings } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import {
  LINE_UP_MAX_ENTRIES,
  type RoomSettings,
  RUNNING_ORDER_MAX_ROWS
} from '@melee/protocol/room'

import { fittedToAloud } from './line-up'
import { dealsHold } from './line-up-deals'
import { type GameSetup, movedToEntry, openedSetup } from './room-settings'
import { orderHolds } from './running-order'

/** The longest name an evening is saved under, in characters. */
export const SAVED_EVENING_NAME_MAX_LENGTH = 40

/** How many evenings one host keeps at most. */
export const SAVED_EVENINGS_MAX = 20

/**
 * An entry as it was saved, or only its game when what it was set to no longer
 * reads — a setting changed shape, a source went away. The game is the part
 * worth keeping: the evening still plays it, on what the host last left it at.
 */
export type SavedEntry = GameSettings | GameKind

/**
 * An evening a host kept under a name, to run again on another night: its
 * entries with what each is set to, how many rounds it plays and the order it
 * plays them in. The teams, the board and the judge are not part of it — those
 * are the host's, laid over every table already.
 */
export type SavedEvening = {
  lineUp: SavedEntry[]
  /** What each entry is dealt to; empty for every entry's default. */
  lineUpDeals: RoomSettings['lineUpDeals']
  name: string
  roundCount: RoomSettings['roundCount']
  /** The order as the host left it; empty to have the room deal one. */
  runningOrder: RoomSettings['runningOrder']
}

/** The evening `settings` is running, kept under `name`. */
export const savedEveningOf = ({
  name,
  settings
}: {
  name: string
  settings: RoomSettings
}): SavedEvening => ({
  lineUp: settings.lineUp,
  lineUpDeals: settings.lineUpDeals,
  name: name.trim().slice(0, SAVED_EVENING_NAME_MAX_LENGTH),
  roundCount: settings.roundCount,
  runningOrder: settings.runningOrder
})

/**
 * The evenings with `evening` kept among them: in place of one of the same
 * name, which is how a host updates a saved evening, and first otherwise. The
 * oldest falls off past `SAVED_EVENINGS_MAX`.
 */
export const withEveningSaved = ({
  evening,
  evenings
}: {
  evening: SavedEvening
  evenings: readonly SavedEvening[]
}): SavedEvening[] => {
  const at = evenings.findIndex((saved) => isSameName(saved.name, evening.name))

  return at === -1
    ? [evening, ...evenings].slice(0, SAVED_EVENINGS_MAX)
    : evenings.with(at, evening)
}

/**
 * The evenings with `imported` folded in from another machine: one of the
 * same name is replaced in place, as keeping it again would, and the rest are
 * added after the ones already here — up to `SAVED_EVENINGS_MAX`, so a file
 * never pushes out an evening this host kept here.
 */
export const withEveningsImported = ({
  evenings,
  imported
}: {
  evenings: readonly SavedEvening[]
  imported: readonly SavedEvening[]
}): SavedEvening[] => {
  const kept = [...evenings]

  for (const evening of imported) {
    const at = kept.findIndex((saved) => isSameName(saved.name, evening.name))

    if (at !== -1) {
      kept[at] = evening
    } else if (kept.length < SAVED_EVENINGS_MAX) {
      kept.push(evening)
    }
  }

  return kept
}

export const withoutEvening = ({
  evenings,
  name
}: {
  evenings: readonly SavedEvening[]
  name: string
}): SavedEvening[] => evenings.filter((saved) => !isSameName(saved.name, name))

/** Whether two names are the same evening's: case and edges aside. */
export const isSameName = (left: string, right: string): boolean =>
  left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase()

/**
 * The room's settings running `evening` from its first round: each entry on
 * what it was saved at, an entry whose settings were lost on what this host
 * last left its game at, the order as it was saved when it still points into
 * the line-up — the room deals one otherwise — and the room on the entry that
 * order opens with. A table answering aloud takes out what it cannot play,
 * the way ticking it would.
 */
export const withSavedEvening = ({
  evening,
  locale,
  rememberedFor,
  settings
}: {
  evening: SavedEvening
  locale: Locale
  /** What this host last left a game set to, or `null` if they never have. */
  rememberedFor: (game: GameKind) => GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const lineUp = evening.lineUp
    .slice(0, LINE_UP_MAX_ENTRIES)
    .map((entry) =>
      typeof entry === 'string'
        ? (rememberedFor(entry) ?? openedSetup({ game: entry, locale })).game
        : entry
    )

  if (lineUp.length === 0) {
    return settings
  }

  const runningOrder = orderHolds({ lineUp, order: evening.runningOrder })
    ? evening.runningOrder.slice(0, RUNNING_ORDER_MAX_ROWS)
    : []
  const lineUpDeals = dealsHold({ deals: evening.lineUpDeals, lineUp })
    ? evening.lineUpDeals
    : []
  const first =
    lineUp.length > 1 ? (runningOrder.find((row) => row !== null) ?? 0) : 0
  const firstEntry = lineUp[first]

  if (firstEntry === undefined) {
    return settings
  }

  const moved = movedToEntry({
    at: first,
    locale,
    remembered: rememberedFor(firstEntry.kind),
    settings: {
      ...settings,
      lineUp,
      lineUpDeals,
      roundCount: evening.roundCount,
      runningOrder
    }
  })

  return fittedToAloud({
    locale,
    rememberedFor,
    settings: { ...moved, roundCount: evening.roundCount }
  })
}
