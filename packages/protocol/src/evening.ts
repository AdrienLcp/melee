import { z } from 'zod'

import { gameKindSchema, gameSettingsSchema } from './game'
import { LINE_UP_MAX_ENTRIES, roomSettingsSchema } from './room'

/** The longest name an evening is kept or shared under, in characters. */
export const EVENING_NAME_MAX_LENGTH = 40

/**
 * An evening as it travels between machines — in a link, or handed over by an
 * assistant: each entry a game's whole settings, or only its kind to open on
 * that game's defaults. Strict, because whoever writes one is told what is
 * wrong; reading one back is the app's lenient `savedEveningSchema`.
 */
export const eveningSchema = z.object({
  lineUp: z
    .array(z.union([gameSettingsSchema, gameKindSchema]))
    .min(1)
    .max(LINE_UP_MAX_ENTRIES),
  lineUpDeals: roomSettingsSchema.shape.lineUpDeals,
  name: z.string().trim().min(1).max(EVENING_NAME_MAX_LENGTH),
  roundCount: roomSettingsSchema.shape.roundCount,
  runningOrder: roomSettingsSchema.shape.runningOrder.default([])
})

export type Evening = z.infer<typeof eveningSchema>
