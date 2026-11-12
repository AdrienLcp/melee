import type { GameKind } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

/**
 * Whether a reveal asks each seat to say it is back at the table. Every one
 * does, because a table all ready starts the next round, save two: the game's
 * last, with the final board after it, and the slate, whose one sheet is the
 * whole game.
 */
export const asksReady = ({
  game,
  isFinal
}: {
  /** The game the round on screen was opened on. */
  game: GameKind
  /** The reveal's `isFinal`. */
  isFinal: boolean
}): boolean => game !== 'slate' && !isFinal

/**
 * Whether any round of the table may ask it: a table of one slate never does,
 * and a line-up asks between its rounds whatever games it holds.
 */
export const mayAskReady = (
  settings: Pick<RoomSettings, 'game' | 'lineUp'>
): boolean => settings.lineUp.length > 1 || settings.game?.kind !== 'slate'
