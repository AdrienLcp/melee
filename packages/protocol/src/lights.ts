import { z } from 'zod'

import { playerIdSchema, serverTimeSchema } from './identifiers'

/**
 * The board is three by three and never moves: the game measures reaction,
 * not aim, and a trackpad chasing a dot loses to a thumb on every round.
 * Cells are numbered row by row from the top left, which is also how the
 * keyboard's two blocks map onto them.
 */
export const LIGHTS_GRID_SIDE = 3
export const LIGHTS_CELL_COUNT = LIGHTS_GRID_SIDE * LIGHTS_GRID_SIDE

export const lightsCellSchema = z
  .number()
  .int()
  .min(0)
  .max(LIGHTS_CELL_COUNT - 1)

/**
 * How long the board stays lit. Fifteen seconds is the shortest race a wall
 * of bars can be watched in, and past thirty the hands tire before the round
 * ends.
 */
export const MIN_LIGHTS_WINDOW_MS = 15_000
export const MAX_LIGHTS_WINDOW_MS = 30_000
export const DEFAULT_LIGHTS_WINDOW_MS = 20_000

export const lightsWindowMsSchema = z
  .number()
  .int()
  .min(MIN_LIGHTS_WINDOW_MS)
  .max(MAX_LIGHTS_WINDOW_MS)

/** Traps are what keeps a hand sweeping the board from being the best play beside a miss's freeze. */
export const DEFAULT_LIGHTS_HAS_TRAPS = true

/** Five rounds, not the shell's ten: a game this physical tires a table sooner. */
export const DEFAULT_LIGHTS_ROUND_COUNT = 5

/** An unsigned 32-bit integer, what `@melee/core/lights/lights-run` seeds its draw with. */
export const MAX_LIGHTS_SEED = 2 ** 32 - 1

/**
 * Public from the countdown: the run is not an answer, every screen needs it
 * to light the same cells, and the floor on every hit is what defends it.
 */
export const lightsSeedSchema = z.number().int().min(0).max(MAX_LIGHTS_SEED)

/** The index of a step in the round's run, from nought; a seat's next step is its count of hits. */
export const lightsStepSchema = z.number().int().nonnegative()

/** One seat's race, the same on every view: the wall's bar is `hits`, its flash is a new `traps`. */
export const lightsSeatCountSchema = z.object({
  hits: z.number().int().nonnegative(),
  playerId: playerIdSchema,
  traps: z.number().int().nonnegative()
})

/**
 * The round as every screen reads it, the wall, the console and every seat
 * alike — nothing in it is withheld. `opensAt` and `closesAt` are server
 * times sent with the countdown, so each screen lights and darkens its board
 * on its own clock estimate and every seat plays a window of the same length,
 * whatever its Wi-Fi.
 */
export const lightsRoundContentSchema = z.object({
  closesAt: serverTimeSchema,
  hasTraps: z.boolean(),
  kind: z.literal('lights'),
  opensAt: serverTimeSchema,
  seats: z.array(lightsSeatCountSchema),
  seed: lightsSeedSchema
})

export type LightsCell = z.infer<typeof lightsCellSchema>
export type LightsSeatCount = z.infer<typeof lightsSeatCountSchema>
export type LightsRoundContent = z.infer<typeof lightsRoundContentSchema>
