import { z } from 'zod'

/**
 * What one move has to achieve: make a false equation true, or make a number
 * the biggest or the smallest one stick can make it.
 */
export const matchsticksGoals = ['equation', 'biggest', 'smallest'] as const

export const matchsticksGoalSchema = z.enum(matchsticksGoals)

/**
 * A puzzle as the glyphs it draws, left to right: seven-segment digits and the
 * three signs an equation needs. The sticks each glyph is made of are the
 * shared rule in `@melee/core/matchsticks/glyphs`, so the wire carries the
 * characters and every screen draws the same sticks from them.
 */
export const matchsticksGlyphsSchema = z.string().regex(/^[0-9+\-=]{1,12}$/)

/**
 * A stick's place inside one glyph: `a` to `g` are a digit's seven segments,
 * clockwise from the top with `g` across the middle, and `h` / `v` the two
 * strokes of a `+` — a `-` is its `h` alone.
 */
export const stickSlots = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'v'] as const

export const stickSlotSchema = z.enum(stickSlots)

export const stickPlaceSchema = z.object({
  /** 0-based, into the puzzle's glyphs. */
  glyphIndex: z.number().int().nonnegative(),
  slot: stickSlotSchema
})

/** One stick picked up and put down somewhere else — on the same glyph or another. */
export const stickMoveSchema = z.object({
  from: stickPlaceSchema,
  to: stickPlaceSchema
})

export const matchsticksPuzzleSchema = z.object({
  glyphs: matchsticksGlyphsSchema,
  goal: matchsticksGoalSchema
})

/** What the puzzle reads once the move is made, and the move that makes it. */
export const matchsticksSolutionSchema = z.object({
  glyphs: matchsticksGlyphsSchema,
  move: stickMoveSchema
})

export type MatchsticksGoal = z.infer<typeof matchsticksGoalSchema>
export type StickSlot = z.infer<typeof stickSlotSchema>
export type StickPlace = z.infer<typeof stickPlaceSchema>
export type StickMove = z.infer<typeof stickMoveSchema>
export type MatchsticksPuzzle = z.infer<typeof matchsticksPuzzleSchema>
export type MatchsticksSolution = z.infer<typeof matchsticksSolutionSchema>
