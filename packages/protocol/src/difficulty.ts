import { z } from 'zod'

export const difficulties = ['easy', 'mixed', 'hard'] as const

/**
 * How hard the content a game deals may be, in one vocabulary for every game
 * that deals content. `mixed` rather than "normal": beside it nobody could tell
 * "normal" from "mixed", and `mixed` is what it does — every tier, in equal
 * shares, which a draw uniform over a lopsided bank is not.
 *
 * It never changes what a round pays: the question gets easier, never the
 * payout, so a score means the same thing from one evening to the next.
 */
export const difficultySchema = z.enum(difficulties)

export type Difficulty = z.infer<typeof difficultySchema>
