import { z } from 'zod'

import { flagFileSchema, silhouetteFileSchema } from './question'

/** Every round climbs the same five rungs, vaguest first. */
export const FIVE_CLUES_CLUE_COUNT = 5

/**
 * How long a clue stays open before the next one goes up, unless every seat
 * still in the race has answered on it first.
 */
export const MIN_CLUE_DURATION_MS = 5_000
export const MAX_CLUE_DURATION_MS = 30_000
export const DEFAULT_CLUE_DURATION_MS = 10_000

/**
 * The UN M49 groups a region clue may name, which the screens translate: the
 * five continents — `002` Africa, `009` Oceania, `019` the Americas, `142`
 * Asia, `150` Europe — and the groups finest-but-one beneath them, `005` South
 * America to `155` Western Europe.
 */
export const m49Regions = [
  '002',
  '005',
  '009',
  '011',
  '013',
  '014',
  '015',
  '017',
  '018',
  '019',
  '021',
  '029',
  '030',
  '034',
  '035',
  '039',
  '053',
  '054',
  '057',
  '061',
  '142',
  '143',
  '145',
  '150',
  '151',
  '154',
  '155'
] as const

export const m49RegionSchema = z.enum(m49Regions)

export type M49Region = z.infer<typeof m49RegionSchema>

/** Rung 1: two numbers the screen prints in its own locale. */
export const sizeClueSchema = z.object({
  areaSquareKilometres: z.number().positive(),
  kind: z.literal('size'),
  population: z.number().int().positive()
})

/**
 * Rung 2: where on the globe, as narrow as still leaves four countries
 * standing — the group finest-but-one, or its continent where that group is
 * too small to hide one.
 */
export const regionClueSchema = z.object({
  kind: z.literal('region'),
  region: m49RegionSchema
})

/** Rung 3: the outline the silhouettes rubric draws, never named after the country. */
export const outlineClueSchema = z.object({
  kind: z.literal('outline'),
  silhouette: silhouetteFileSchema
})

/** The most a cities clue names. */
export const MOST_CLUE_CITIES = 3

/**
 * Rung 4: its largest cities, never its capital, in the room's question
 * language — none whose name carries the country's own.
 */
export const citiesClueSchema = z.object({
  cities: z.array(z.string().min(1)).min(1).max(MOST_CLUE_CITIES),
  kind: z.literal('cities')
})

/** Rung 5: the flag and the capital together, the clue nobody should need. */
export const flagClueSchema = z.object({
  capital: z.string().min(1),
  flag: flagFileSchema,
  kind: z.literal('flag')
})

export const fiveCluesClueSchema = z.discriminatedUnion('kind', [
  sizeClueSchema,
  regionClueSchema,
  outlineClueSchema,
  citiesClueSchema,
  flagClueSchema
])

export type FiveCluesClue = z.infer<typeof fiveCluesClueSchema>

/** A country's five clues in the order they open; a screen is sent only the ones already open. */
export const fiveCluesLadderSchema = z.tuple([
  sizeClueSchema,
  regionClueSchema,
  outlineClueSchema,
  citiesClueSchema,
  flagClueSchema
])

export type FiveCluesLadder = z.infer<typeof fiveCluesLadderSchema>
