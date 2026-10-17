import { z } from 'zod'

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

export type GeoPoint = z.infer<typeof geoPointSchema>
export type Placement = z.infer<typeof placementSchema>
