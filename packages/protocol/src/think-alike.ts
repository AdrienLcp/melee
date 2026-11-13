import { z } from 'zod'

import { playerIdSchema } from './identifiers'

/** A prompt is read at a glance from across the room: *a red fruit*, *something you find in a fridge*. */
export const THINK_ALIKE_PROMPT_MAX_LENGTH = 80

/** Public from the first frame: it is the question, and no answer exists before the room writes one. */
export const thinkAlikePromptSchema = z
  .string()
  .trim()
  .min(1)
  .max(THINK_ALIKE_PROMPT_MAX_LENGTH)

/** One word, or a name of a few: *fraise*, *Tour Eiffel*. */
export const THINK_ALIKE_ANSWER_MAX_LENGTH = 40

/** Sent once and never blank: a seat with nothing to say lets the clock run out. */
export const thinkAlikeAnswerSchema = z
  .string()
  .trim()
  .min(1)
  .max(THINK_ALIKE_ANSWER_MAX_LENGTH)

/**
 * Short on purpose: the first word that comes to mind is the game, and a long
 * clock lets a table out-think itself.
 */
export const MIN_THINK_ALIKE_ROUND_MS = 10_000
export const MAX_THINK_ALIKE_ROUND_MS = 60_000

/**
 * One answer the room wrote at the reveal, every spelling of it together, and
 * every group the console merged into it.
 */
export const thinkAlikeGroupSchema = z.object({
  authors: z.array(playerIdSchema).min(1),
  /** The crowd key every spelling folds to: what a merge names the group by. */
  key: z.string().min(1),
  /** The keys of the groups the console merged into this one, which _take it back out_ names. */
  mergedKeys: z.array(z.string().min(1)),
  /** The spelling most of its own authors wrote. */
  text: z.string().min(1).max(THINK_ALIKE_ANSWER_MAX_LENGTH)
})

export type ThinkAlikeGroup = z.infer<typeof thinkAlikeGroupSchema>
