import type { GameKind } from '@melee/protocol/game'

/**
 * Whether a reveal asks each seat to say it is back at the table. Every one
 * does, because a table all ready starts the next round, save two: the last
 * round of a counted game, with nothing after it, and the slate, whose one
 * sheet is the whole game.
 */
export const asksReady = ({
  game,
  roundCount,
  roundIndex
}: {
  /** The game the round on screen was opened on. */
  game: GameKind
  roundCount: number | null
  /** The round on screen, counted from 1. */
  roundIndex: number
}): boolean =>
  game !== 'slate' && (roundCount === null || roundIndex < roundCount)
