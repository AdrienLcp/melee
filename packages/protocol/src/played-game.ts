import { z } from 'zod'

import { gameKindSchema } from './game'
import { playerIdSchema } from './identifiers'

/** What one seat earned over every round of one line-up entry. */
export const seatTotalSchema = z.object({
  playerId: playerIdSchema,
  /** On the board's scale — see `POINT`. */
  points: z.number().int().nonnegative()
})

/**
 * One line-up entry the game has opened rounds on, and what each seat earned
 * on them: what the final board crowns the best player of each game from.
 * Public, because every figure on it was already on a reveal.
 */
export const playedGameSchema = z.object({
  kind: gameKindSchema,
  /**
   * The entry of `settings.lineUp` it was played from, and `null` once the
   * line-up no longer holds it — an entry edited mid-evening is another entry.
   */
  lineUpAt: z.number().int().min(0).nullable(),
  /** The rounds the room opened on it, which every seat's total is averaged over. */
  roundCount: z.number().int().positive(),
  /** The seats it paid, in no order; a seat it paid nothing is absent. */
  totals: z.array(seatTotalSchema)
})

export type SeatTotal = z.infer<typeof seatTotalSchema>
export type PlayedGame = z.infer<typeof playedGameSchema>
