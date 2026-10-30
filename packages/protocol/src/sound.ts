import { z } from 'zod'

import { sessionIdSchema } from './identifiers'

/**
 * A wall as the console names it: its session id, which survives the wall's
 * own reload, so a host's pick outlives a screen that blinked.
 */
export const wallIdSchema = sessionIdSchema

/**
 * The screen that plays the clip and the cues — the console itself, or one of
 * the walls. Only one ever sounds: two speakers a few metres apart are an echo.
 */
export const speakerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('console') }),
  z.object({ kind: z.literal('wall'), wallId: wallIdSchema })
])

/** 0 to 1, the scale an `HTMLMediaElement` takes. */
export const roomVolumeSchema = z.number().min(0).max(1)

/** One wall as the console lists it. */
export const wallScreenSchema = z.object({
  id: wallIdSchema,
  /** Whether this wall is the one sounding right now. */
  isSpeaker: z.boolean(),
  /**
   * What the wall shows of itself and the console calls it by, from 1: the
   * lowest number no other wall holds as it arrives.
   */
  number: z.number().int().positive()
})

export type WallId = z.infer<typeof wallIdSchema>
export type Speaker = z.infer<typeof speakerSchema>
export type WallScreen = z.infer<typeof wallScreenSchema>
