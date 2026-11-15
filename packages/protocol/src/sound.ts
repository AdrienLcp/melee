import { z } from 'zod'

import { roundIdSchema, sessionIdSchema } from './identifiers'

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

/**
 * Why the speaker's clip is not sounding, as the speaker itself saw it:
 * `blocked` — the browser refused to play on that screen; `unreachable` — the
 * clip's file would not load, which is the catalogue's CDN or the screen's
 * connection, never its speakers; `stalled` — the clip was told to play and has
 * not moved for a couple of seconds.
 */
export const clipFaultSchema = z.enum(['blocked', 'unreachable', 'stalled'])

/**
 * A clip the speaker reported silent, as the console reads it: the round it
 * was reported on, and the wall it sounds on — `null` for the console itself.
 * Only ever about the round on screen and the screen still sounding, so it
 * needs no clearing: the next round, or another speaker, is not it.
 */
export const silentClipSchema = z.object({
  cause: clipFaultSchema,
  roundId: roundIdSchema,
  wallNumber: z.number().int().positive().nullable()
})

/**
 * Where a sample may be fetched from: Deezer's preview CDN and nowhere else,
 * so a forged console cannot make the room's screen sound an address of its
 * choosing.
 */
export const soundCheckUrlSchema = z
  .url({ protocol: /^https$/ })
  .refine((url) => new URL(url).hostname.endsWith('.dzcdn.net'))

/**
 * How a sound check went on the speaker: `heard` — the sample moved, at the
 * room volume; otherwise the `ClipFault` a round's clip would have met there.
 */
export const soundCheckOutcomeSchema = z.enum([
  'heard',
  ...clipFaultSchema.options
])

/** The last sound check a wall reported, by the check it answers. */
export const soundCheckReportSchema = z.object({
  checkId: z.number().int(),
  outcome: soundCheckOutcomeSchema
})

export type ClipFault = z.infer<typeof clipFaultSchema>
export type SoundCheckOutcome = z.infer<typeof soundCheckOutcomeSchema>
export type SoundCheckReport = z.infer<typeof soundCheckReportSchema>
export type SilentClip = z.infer<typeof silentClipSchema>
export type WallId = z.infer<typeof wallIdSchema>
export type Speaker = z.infer<typeof speakerSchema>
export type WallScreen = z.infer<typeof wallScreenSchema>
