import type { GameKind, GameSettings } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import type { RoomSettings } from '@melee/protocol/room'

import { capabilitiesOf } from './game-capabilities'
import { isPlayedOut } from './next-game'
import { type GameSetup, movedToEntry } from './room-settings'
import { remappedOrder, scheduledEntryAt } from './running-order'

const isBlank = (text: string | null | undefined): boolean =>
  (text ?? '').trim() === ''

/**
 * Whether the host brought nothing to an entry of theirs, as far as this
 * console can tell: a challenge with no line typed, a slate with no item
 * labelled and no key noted, and every buzzer — its questions are never on a
 * screen. The line and the keys are the console's, not the entry's, which is
 * why only the next round can be asked.
 */
const isUnprepared = ({
  challengeText,
  entry,
  slateKeys
}: {
  challengeText: string | undefined
  entry: GameSettings
  slateKeys: readonly (string | null)[]
}): boolean => {
  switch (entry.kind) {
    case 'buzzer':
      return true
    case 'challenge':
      return isBlank(challengeText)
    case 'slate':
      return entry.labels.every(isBlank) && slateKeys.every(isBlank)
    default:
      return false
  }
}

const withoutIndex = <T>(items: readonly T[], at: number): T[] =>
  items.filter((_item, index) => index !== at)

/**
 * Whether the console offers to skip the round drawn next: an entry the host
 * brings, not played yet, with nothing in it, and something left to deal once
 * it is gone — skipping the last of them would end the evening, which is what
 * *End game* already says.
 */
export const offersSkip = ({
  challengeText,
  lineUp,
  lineUpAt,
  played,
  slateKeys
}: {
  /** The challenge line typed at the press. */
  challengeText: string | undefined
  lineUp: readonly GameSettings[]
  lineUpAt: number | null
  /** How many rounds each entry has opened this evening, by index. */
  played: readonly number[]
  /** The keys this console noted for the slate. */
  slateKeys: readonly (string | null)[]
}): boolean => {
  const entry = lineUpAt === null ? undefined : lineUp[lineUpAt]

  if (lineUpAt === null || entry === undefined || lineUp.length < 2) {
    return false
  }

  const rest = withoutIndex(lineUp, lineUpAt)
  const restPlayed = withoutIndex(played, lineUpAt)

  return (
    !capabilitiesOf(entry.kind).servesItsOwnContent &&
    (played[lineUpAt] ?? 0) === 0 &&
    isUnprepared({ challengeText, entry, slateKeys }) &&
    rest.some(
      (other, index) =>
        !isPlayedOut({ entry: other, played: restPlayed[index] ?? 0 })
    )
  )
}

/**
 * The settings with the entry the next round is on taken out of the evening
 * and another drawn in its place. The evening keeps its length: the rounds
 * that entry would have played go back to the draw, which deals them among
 * the entries left — played ones included. In an evening in order, its row
 * is left to chance.
 */
export const withEntrySkipped = ({
  lastAt,
  locale,
  played,
  random,
  rememberedFor,
  roundAt,
  roundsLeft,
  settings
}: {
  /** The entry the round on screen was opened from. */
  lastAt: number | null
  locale: Locale
  played: readonly number[]
  random: () => number
  rememberedFor: (game: GameKind) => GameSetup | null
  /** As `scheduledEntryAt`'s. */
  roundAt: number
  /** As `nextEntryAt`'s. */
  roundsLeft: number | null
  settings: RoomSettings
}): RoomSettings => {
  const { lineUp, lineUpAt } = settings

  if (lineUpAt === null || lineUp.length < 2) {
    return settings
  }

  const rest = withoutIndex(lineUp, lineUpAt)
  const shiftedLastAt =
    lastAt === null || lastAt === lineUpAt
      ? null
      : lastAt > lineUpAt
        ? lastAt - 1
        : lastAt
  const runningOrder = remappedOrder({
    indexAfter: (index) =>
      index === lineUpAt ? null : index > lineUpAt ? index - 1 : index,
    order: settings.runningOrder
  })
  const drawn = scheduledEntryAt({
    lastAt: shiftedLastAt,
    lineUp: rest,
    order: runningOrder,
    played: withoutIndex(played, lineUpAt),
    random,
    roundAt,
    roundsLeft
  })
  const landing = drawn === null ? undefined : rest[drawn]

  if (drawn === null || landing === undefined) {
    return settings
  }

  // A skip leaving one entry is still the evening it was, not a room of one
  // game, which would take that game's own count and hold.
  return {
    ...movedToEntry({
      at: drawn,
      locale,
      remembered: rememberedFor(landing.kind),
      settings: { ...settings, lineUp: rest, runningOrder }
    }),
    autoAdvanceMs: settings.autoAdvanceMs,
    roundCount: settings.roundCount
  }
}
