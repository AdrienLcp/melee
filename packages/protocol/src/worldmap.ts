import { z } from 'zod'

import { countryCodeSchema } from './country-code'
import { playerIdSchema } from './identifiers'

/**
 * A place on the globe, in degrees. The device inverts its own projection to
 * produce it, so what crosses the wire is geography and never a pixel: the
 * server decides what it hit, on a map no screen can bend.
 */
export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
})

/**
 * Where one player put the marker. Hidden until the reveal — a marker is the
 * answer the moment it lands, and a room watching another's drop could copy it.
 * How far it fell is the award's verdict rather than a field here, so the two
 * cannot disagree.
 */
export const placementSchema = z.object({
  playerId: playerIdSchema,
  point: geoPointSchema
})

/**
 * What a map round asks a table to place: a country on the whole world, or a
 * city on a map of metropolitan France. The game's own setting, chosen like a
 * blind test's source, and it decides the map, the bank and the price at once.
 */
export const worldmapPlacesSchema = z.enum(['countries', 'frenchCities'])

/**
 * What one round asks for. A country is public from the first frame, because
 * naming it *is* the question and every screen already draws its outline. A
 * city is named from the first frame too, but where it stands is the answer:
 * its point is `null` until the reveal, so no screen holds it while a pawn can
 * still move.
 */
export const worldmapTargetKindSchema = z.enum(['country', 'city'])

export const worldmapTargetSchema = z.discriminatedUnion('kind', [
  z.object({
    countryCode: countryCodeSchema,
    kind: z.literal(worldmapTargetKindSchema.enum.country)
  }),
  z.object({
    kind: z.literal(worldmapTargetKindSchema.enum.city),
    /** Its own name, the same in every language the room speaks: *Rennes*. */
    name: z.string().min(1),
    point: geoPointSchema.nullable()
  })
])

export type GeoPoint = z.infer<typeof geoPointSchema>
export type Placement = z.infer<typeof placementSchema>
export type WorldmapPlaces = z.infer<typeof worldmapPlacesSchema>
export type WorldmapTargetKind = z.infer<typeof worldmapTargetKindSchema>
export type WorldmapTarget = z.infer<typeof worldmapTargetSchema>
