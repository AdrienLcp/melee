import { z } from 'zod'

/**
 * How long the table is asked to count, in whole seconds. Ten is the shortest
 * count worth a round, and three minutes of silence is already longer than a
 * room holds still.
 */
export const MIN_INNERCLOCK_TARGET_SECONDS = 10
export const MAX_INNERCLOCK_TARGET_SECONDS = 180

export const innerclockTargetSecondsSchema = z
  .number()
  .int()
  .min(MIN_INNERCLOCK_TARGET_SECONDS)
  .max(MAX_INNERCLOCK_TARGET_SECONDS)

export type InnerclockTargetSeconds = z.infer<
  typeof innerclockTargetSecondsSchema
>
