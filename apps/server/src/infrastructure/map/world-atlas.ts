import { geoArea, geoCentroid, geoContains } from 'd3-geo'
import { merge } from 'topojson-client'
import atlas from 'world-atlas/countries-50m.json' with { type: 'json' }
import { z } from 'zod'

import type { GeoPoint } from '@melee/protocol/atlas'
import type { CountryCode } from '@melee/protocol/country-code'

import {
  COUNTRY_CODE_BY_ATLAS_ID,
  COUNTRY_CODE_BY_ATLAS_NAME
} from '@melee/core/atlas/atlas-country-codes'
import type { CountryShape, Ring } from '@melee/core/atlas/distance'

/**
 * The one module that reads the world's outlines on the server, and the only
 * one that knows they are Natural Earth's 1:50m TopoJSON measured by d3. The
 * screens draw the same file; this side measures it, so a marker is judged on
 * shapes no device sent.
 */
const arcIndexesSchema = z.array(z.number())
const countryPropertiesSchema = z.object({ name: z.string() })

const shapeSchema = z.discriminatedUnion('type', [
  z.object({
    arcs: z.array(arcIndexesSchema),
    id: z.string().optional(),
    properties: countryPropertiesSchema,
    type: z.literal('Polygon')
  }),
  z.object({
    arcs: z.array(z.array(arcIndexesSchema)),
    id: z.string().optional(),
    properties: countryPropertiesSchema,
    type: z.literal('MultiPolygon')
  })
])
type AtlasShape = z.infer<typeof shapeSchema>

const pairSchema = z.tuple([z.number(), z.number()])

const topologySchema = z.object({
  arcs: z.array(z.array(z.array(z.number()))),
  objects: z.object({
    countries: z.object({
      geometries: z.array(shapeSchema),
      type: z.literal('GeometryCollection')
    })
  }),
  transform: z.object({ scale: pairSchema, translate: pairSchema }),
  type: z.literal('Topology')
})

const codeOf = (shape: AtlasShape): CountryCode | null =>
  (shape.id === undefined
    ? COUNTRY_CODE_BY_ATLAS_NAME[shape.properties.name]
    : COUNTRY_CODE_BY_ATLAS_ID[shape.id]) ?? null

type Topology = z.infer<typeof topologySchema>

let atlasByCode: {
  shapesByCode: Map<CountryCode, AtlasShape[]>
  topology: Topology
} | null = null

/**
 * Parsed on the first map round rather than at load: an isolate that never
 * serves one never pays for the 750 kB. The atlas ships with the Worker, so a
 * file that does not parse is a broken build rather than an input to recover from.
 */
const readAtlas = () => {
  if (atlasByCode === null) {
    const topology = topologySchema.parse(atlas)
    const shapesByCode = new Map<CountryCode, AtlasShape[]>()

    for (const shape of topology.objects.countries.geometries) {
      const code = codeOf(shape)

      if (code !== null) {
        shapesByCode.set(code, [...(shapesByCode.get(code) ?? []), shape])
      }
    }

    atlasByCode = { shapesByCode, topology }
  }

  return atlasByCode
}

const shapeCache = new Map<CountryCode, CountryShape>()

/**
 * A country as the judging reads it, every shape the atlas draws for it merged
 * into one — mainland, islands and the holes another country makes in it —
 * or `null` for a code the atlas does not draw.
 */
export const countryShapeOf = (code: CountryCode): CountryShape | null => {
  const cached = shapeCache.get(code)

  if (cached !== undefined) {
    return cached
  }

  const { shapesByCode, topology } = readAtlas()
  const shapes = shapesByCode.get(code)

  if (shapes === undefined) {
    return null
  }

  const geometry = merge(topology, shapes)
  const rings: Ring[] = geometry.coordinates.flatMap((polygon) =>
    polygon.map((ring) =>
      ring.map(
        ([longitude = 0, latitude = 0]) => [longitude, latitude] as const
      )
    )
  )

  const shape: CountryShape = {
    contains: ({ latitude, longitude }) =>
      geoContains(geometry, [longitude, latitude]),
    rings
  }

  shapeCache.set(code, shape)

  return shape
}

const pointInsideCache = new Map<CountryCode, GeoPoint | null>()

/**
 * A point the country's own outline contains, which a screen fills the country
 * from: the centre of its largest piece, or of the next piece whose centre
 * falls inside it — a crescent's centre is out at sea. `null` for a code the
 * atlas does not draw, or one no piece of which holds its own centre.
 */
export const pointInsideCountry = (code: CountryCode): GeoPoint | null => {
  const cached = pointInsideCache.get(code)

  if (cached !== undefined) {
    return cached
  }

  const { shapesByCode, topology } = readAtlas()
  const shapes = shapesByCode.get(code)
  const geometry = shapes === undefined ? null : merge(topology, shapes)

  const centre =
    geometry?.coordinates
      .map((coordinates) => ({ coordinates, type: 'Polygon' as const }))
      .toSorted((one, other) => geoArea(other) - geoArea(one))
      .map((piece) => geoCentroid(piece))
      .find((candidate) => geoContains(geometry, candidate)) ?? null

  const point =
    centre === null ? null : { latitude: centre[1], longitude: centre[0] }

  pointInsideCache.set(code, point)

  return point
}
