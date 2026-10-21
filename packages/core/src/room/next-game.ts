import type { GameSettings } from '@melee/protocol/game'

/**
 * Which entry of the line-up the next round is drawn on: one of another game
 * than the round just played whenever there is one, then any entry but that
 * one — two quizzes back to back is the draw looking broken even when it is
 * fair, and so are a blind test on the charts and one on film scores, which a
 * table hears as the same game twice. `null` only for an empty line-up.
 */
export const nextEntryAt = ({
  lastAt,
  lineUp,
  random
}: {
  /** The entry the round just played was opened from, or `null` before the first. */
  lastAt: number | null
  lineUp: readonly GameSettings[]
  /** In `[0, 1)`, as `Math.random` — passed in so the draw stays a pure function. */
  random: () => number
}): number | null => {
  const lastKind = lastAt === null ? null : lineUp[lastAt]?.kind
  const indices = lineUp.map((_entry, index) => index)
  const otherGames = indices.filter((index) => lineUp[index]?.kind !== lastKind)
  const otherEntries = indices.filter((index) => index !== lastAt)
  const pool = [otherGames, otherEntries, indices].find(
    (candidates) => candidates.length > 0
  )

  return pool?.[Math.floor(random() * pool.length)] ?? null
}
