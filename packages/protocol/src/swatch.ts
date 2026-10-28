import { z } from 'zod'

/**
 * A colour as every screen sends and draws it: sRGB, six lowercase hex digits.
 * What a screen can show is what a seat can answer, so a wider space would be
 * a precision no picker reaches and no wall displays.
 */
export const colourHexSchema = z.string().regex(/^#[0-9a-f]{6}$/)

/**
 * How long the colour stays up before it hides. Two seconds is a glance a
 * table can still call fair; ten is long enough to name it, which turns
 * remembering a colour into remembering a word.
 */
export const MIN_SWATCH_SHOW_MS = 2_000
export const MAX_SWATCH_SHOW_MS = 10_000

export const swatchShowMsSchema = z
  .number()
  .int()
  .min(MIN_SWATCH_SHOW_MS)
  .max(MAX_SWATCH_SHOW_MS)

export type ColourHex = z.infer<typeof colourHexSchema>
