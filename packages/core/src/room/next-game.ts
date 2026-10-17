import type { GameKind } from '@melee/protocol/game'

/**
 * The game the next round is drawn on: any of the line-up but the one just
 * played, whenever there is another — two quizzes back to back is the draw
 * looking broken even when it is fair. `null` only for an empty line-up.
 */
export const nextGame = ({
  last,
  lineUp,
  random
}: {
  /** The game the round just played was opened on, or `null` before the first. */
  last: GameKind | null
  lineUp: readonly GameKind[]
  /** In `[0, 1)`, as `Math.random` — passed in so the draw stays a pure function. */
  random: () => number
}): GameKind | null => {
  const fresh = lineUp.filter((game) => game !== last)
  const pool = fresh.length > 0 ? fresh : lineUp

  return pool[Math.floor(random() * pool.length)] ?? null
}
