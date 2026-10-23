import type { GameSettings } from '@melee/protocol/game'

import { capabilitiesOf } from './game-capabilities'

/**
 * Which entry of the line-up the next round is drawn on, the evening being a
 * deck the line-up deals: every entry comes up once before any comes up twice,
 * an entry whose content the host brings comes up once and never again, and
 * the rounds left over go to the games that serve their own.
 *
 * A counted evening spends its last rounds on the entries still owed, so every
 * one plays at least once. Short of that, another game than the round just
 * played wins over balance — two quizzes back to back is the draw looking
 * broken even when it is fair, and so are a blind test on the charts and one
 * on film scores, which a table hears as the same game twice.
 *
 * `null` when nothing is left to deal: an empty line-up, or one whose every
 * entry was the host's and is played.
 */
export const nextEntryAt = ({
  lastAt,
  lineUp,
  played,
  random,
  roundsLeft
}: {
  /** The entry the round just played was opened from, or `null` before the first. */
  lastAt: number | null
  lineUp: readonly GameSettings[]
  /** How many rounds each entry has opened this evening, by index. */
  played: readonly number[]
  /** In `[0, 1)`, as `Math.random` — passed in so the draw stays a pure function. */
  random: () => number
  /** The rounds still to play, the one being drawn included; `null` until the host ends it. */
  roundsLeft: number | null
}): number | null => {
  const timesPlayed = (index: number) => played[index] ?? 0
  const lastKind = lastAt === null ? null : lineUp[lastAt]?.kind

  const inDeck = entriesInDeck({ lineUp, played })
  const owed = inDeck.filter((index) => timesPlayed(index) === 0)
  const due = roundsLeft !== null && roundsLeft <= owed.length ? owed : inDeck

  const fewest = Math.min(...due.map(timesPlayed))
  const balanced = due.filter((index) => timesPlayed(index) === fewest)
  const isOtherGame = (index: number) => lineUp[index]?.kind !== lastKind
  const isOtherEntry = (index: number) => index !== lastAt

  const pool = [
    balanced.filter(isOtherGame),
    due.filter(isOtherGame),
    balanced.filter(isOtherEntry),
    due.filter(isOtherEntry),
    due
  ].find((candidates) => candidates.length > 0)

  return pool?.[Math.floor(random() * pool.length)] ?? null
}

/**
 * Whether an evening of several entries still has one to deal. One that has
 * not is over, even short of its count: every entry left was the host's, and
 * is played. A single entry plays on as a room of one game always has.
 */
export const hasEntryLeftToDeal = ({
  lineUp,
  played
}: {
  lineUp: readonly GameSettings[]
  /** As `nextEntryAt`'s. */
  played: readonly number[]
}): boolean => lineUp.length < 2 || entriesInDeck({ lineUp, played }).length > 0

const entriesInDeck = ({
  lineUp,
  played
}: {
  lineUp: readonly GameSettings[]
  played: readonly number[]
}): number[] =>
  lineUp.flatMap((entry, index) =>
    capabilitiesOf(entry.kind).servesItsOwnContent || (played[index] ?? 0) === 0
      ? [index]
      : []
  )

/**
 * How many rounds each entry of `lineUp` has opened, from the entries the
 * rounds opened on. Counted by value rather than by index, because a tick or
 * a variant shifts every index after it. Each round counts once, towards the
 * least played of the entries still equal to what it opened on, so one round
 * of two identical entries leaves the other owed.
 */
export const playedPerEntry = ({
  lineUp,
  opened
}: {
  lineUp: readonly GameSettings[]
  /** The entry each round of this game opened on, in order. */
  opened: readonly GameSettings[]
}): number[] => {
  const keys = lineUp.map((entry) => JSON.stringify(entry))
  const played = lineUp.map(() => 0)

  for (const entry of opened) {
    const key = JSON.stringify(entry)
    const matching = keys.flatMap((candidate, index) =>
      candidate === key ? [index] : []
    )
    const fewest = matching.reduce<number | null>(
      (best, index) =>
        best === null || (played[index] ?? 0) < (played[best] ?? 0)
          ? index
          : best,
      null
    )

    if (fewest !== null) {
      played[fewest] = (played[fewest] ?? 0) + 1
    }
  }

  return played
}
