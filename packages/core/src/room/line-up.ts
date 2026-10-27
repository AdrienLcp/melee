import type { GameKind, GameSettings } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import { LINE_UP_MAX_ENTRIES, type RoomSettings } from '@melee/protocol/room'

import { isPlayableAloud } from './game-capabilities'
import {
  type GameSetup,
  movedToEntry,
  movedToGame,
  openedSetup
} from './room-settings'
import { orderHolds, orderWithEntryAdded, remappedOrder } from './running-order'

/**
 * Whether `game` was opened from the entry `lineUpAt` points at — always, once
 * there is a game, and nothing ticked before there is. The schema cannot say
 * it across three fields, so the server asks here before it accepts a settings
 * frame. Nor can it say that a table answering aloud ticks only games played
 * without a screen.
 *
 * The kind is what has to agree, not the settings: the entry follows `game`
 * once the frame is accepted, which is `followedByLineUp`. A running order
 * points at entries of the line-up and nowhere else.
 */
export const lineUpHolds = (settings: RoomSettings): boolean => {
  const { game, lineUp, lineUpAt, runningOrder, teams } = settings

  if (game === null) {
    return lineUp.length === 0 && lineUpAt === null && runningOrder.length === 0
  }

  return (
    lineUpAt !== null &&
    orderHolds({ lineUp, order: runningOrder }) &&
    lineUp[lineUpAt]?.kind === game.kind &&
    lineUp.every((entry) => isPlayableAloud({ game: entry.kind, teams }))
  )
}

/**
 * The settings with `game` written back into the entry it was opened from, so
 * a blind test moved to film scores in the fold is the film-score entry from
 * then on, and comes back on them when it is drawn again.
 */
export const followedByLineUp = (settings: RoomSettings): RoomSettings =>
  settings.game === null || settings.lineUpAt === null
    ? settings
    : {
        ...settings,
        lineUp: settings.lineUp.with(settings.lineUpAt, settings.game)
      }

/** The games ticked, each once, in the order they were first ticked. */
export const kindsInLineUp = (lineUp: readonly GameSettings[]): GameKind[] => [
  ...new Set(lineUp.map((entry) => entry.kind))
]

/**
 * The settings with every entry of `game` ticked into the line-up or taken out
 * of it.
 *
 * The first tick of a room still deciding picks its game. A game joins on what
 * this host last left it set to. Taking out the game the next round is on
 * moves the room to the first entry left. The last game cannot be taken out: a
 * room that has picked a game does not go back to deciding.
 */
export const toggledInLineUp = ({
  game,
  locale,
  rememberedFor,
  settings
}: {
  game: GameKind
  locale: Locale
  /** What this host last left a game set to, or `null` if they never have. */
  rememberedFor: (game: GameKind) => GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const { lineUp } = settings

  if (!lineUp.some((entry) => entry.kind === game)) {
    return withEntryAdded({
      game,
      locale,
      remembered: rememberedFor(game),
      settings
    })
  }

  return withoutEntries({
    isTakenOut: (entry) => entry.kind === game,
    locale,
    rememberedFor,
    settings
  })
}

/**
 * The settings with one more entry of `game` at the end of the line-up, on
 * what this host last left the game set to — a second entry of a game already
 * there is a variant the host then sets apart. The next round stays where it
 * was: adding a round to the evening is not choosing it, and the evening
 * plays it last. A room still deciding picks the game instead, and a
 * full line-up is left as it is.
 */
export const withEntryAdded = ({
  game,
  locale,
  remembered,
  settings
}: {
  game: GameKind
  locale: Locale
  /** What this host last left `game` set to, or `null` if they never have. */
  remembered: GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  if (settings.game === null) {
    return movedToGame({ game, locale, remembered, settings })
  }

  if (settings.lineUp.length >= LINE_UP_MAX_ENTRIES) {
    return settings
  }

  const joining = (remembered ?? openedSetup({ game, locale })).game

  return {
    ...settings,
    lineUp: [...settings.lineUp, joining],
    runningOrder: orderWithEntryAdded({
      at: settings.lineUp.length,
      order: settings.runningOrder
    })
  }
}

/**
 * The settings with a copy of the line-up's entry `at`, set exactly as it is,
 * planned on the row after its own still to come, or last when it has none.
 * Copying the entry is what adding its game cannot do: the host's setup is
 * remembered once per game, so a second quiz added from the shelf joins on
 * whichever quiz was set last rather than the one being copied. A full
 * line-up is left as it is.
 */
export const withEntryDuplicated = ({
  at,
  settings,
  upcoming
}: {
  at: number
  settings: RoomSettings
  /** The round about to open, counted from 0. */
  upcoming: number
}): RoomSettings => {
  const followed = followedByLineUp(settings)
  const entry = followed.lineUp[at]

  if (entry === undefined || followed.lineUp.length >= LINE_UP_MAX_ENTRIES) {
    return settings
  }

  const copyAt = followed.lineUp.length
  const ownRow = followed.runningOrder.findIndex(
    (row, index) => index >= upcoming && row === at
  )

  return {
    ...followed,
    lineUp: [...followed.lineUp, entry],
    runningOrder:
      ownRow === -1
        ? orderWithEntryAdded({ at: copyAt, order: followed.runningOrder })
        : followed.runningOrder.toSpliced(ownRow + 1, 0, copyAt)
  }
}

/**
 * The settings with the line-up's entry `at` taken out. When it was the one
 * the next round is on, the room moves to the entry after it, or to the one
 * before it at the end; the last entry cannot be taken out.
 */
export const withoutEntry = ({
  at,
  locale,
  rememberedFor,
  settings
}: {
  at: number
  locale: Locale
  rememberedFor: (game: GameKind) => GameSetup | null
  settings: RoomSettings
}): RoomSettings =>
  withoutEntries({
    isTakenOut: (_entry, index) => index === at,
    locale,
    rememberedFor,
    settings
  })

const withoutEntries = ({
  isTakenOut,
  locale,
  rememberedFor,
  settings
}: {
  isTakenOut: (entry: GameSettings, index: number) => boolean
  locale: Locale
  rememberedFor: (game: GameKind) => GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const { lineUp, lineUpAt } = settings
  const kept = lineUp.flatMap((entry, index) =>
    isTakenOut(entry, index) ? [] : [{ entry, index }]
  )

  if (kept.length === 0 || kept.length === lineUp.length) {
    return settings
  }

  const rest = kept.map(({ entry }) => entry)
  const indexAfter = (index: number) => {
    const at = kept.findIndex((candidate) => candidate.index === index)

    return at === -1 ? null : at
  }
  const runningOrder = remappedOrder({
    indexAfter,
    order: settings.runningOrder
  })
  const stillAt = lineUpAt === null ? null : indexAfter(lineUpAt)

  if (stillAt !== null) {
    return { ...settings, lineUp: rest, lineUpAt: stillAt, runningOrder }
  }

  const after = kept.findIndex(
    ({ index }) => lineUpAt === null || index > lineUpAt
  )
  const at = after === -1 ? rest.length - 1 : after
  const landing = rest[at]

  return landing === undefined
    ? settings
    : movedToEntry({
        at,
        locale,
        remembered: rememberedFor(landing.kind),
        settings: { ...settings, lineUp: rest, runningOrder }
      })
}

/** What an evening falls back to when none of its games can be played aloud. */
const FIRST_GAME_ALOUD: GameKind = 'quiz'

/**
 * The settings with every game a table answering aloud cannot play taken out
 * of the line-up, so the press that turns it on is the whole change. A room
 * still deciding has nothing to take out; an evening of only such games gets
 * the quiz, because the last tick never goes on its own.
 */
export const fittedToAloud = ({
  locale,
  rememberedFor,
  settings
}: {
  locale: Locale
  rememberedFor: (game: GameKind) => GameSetup | null
  settings: RoomSettings
}): RoomSettings => {
  const playsAloud = (game: GameKind) =>
    isPlayableAloud({ game, teams: settings.teams })
  const kinds = kindsInLineUp(settings.lineUp)

  if (kinds.length === 0 || kinds.every(playsAloud)) {
    return settings
  }

  const toggle = (from: RoomSettings, game: GameKind) =>
    toggledInLineUp({ game, locale, rememberedFor, settings: from })

  const withOne = kinds.some(playsAloud)
    ? settings
    : toggle(settings, FIRST_GAME_ALOUD)

  return kindsInLineUp(withOne.lineUp)
    .filter((game) => !playsAloud(game))
    .reduce(toggle, withOne)
}
