import {
  type GeoProjection,
  geoEqualEarth,
  geoGraticule10,
  geoPath
} from 'd3-geo'
import { merge } from 'topojson-client'
import atlas from 'world-atlas/countries-50m.json' with { type: 'json' }
import { z } from 'zod'

import type { CountryCode } from '@melee/protocol/country-code'
import type { GeoPoint } from '@melee/protocol/worldmap'

import {
  COUNTRY_CODE_BY_ATLAS_ID,
  COUNTRY_CODE_BY_ATLAS_NAME
} from '@melee/core/worldmap/atlas-country-codes'

/**
 * The one module that reads the world's outlines in the browser and projects
 * them: Natural Earth's 1:50m TopoJSON — the file the server judges a marker
 * against, so a coastline on screen is the coastline that scores — drawn in
 * Equal Earth, which keeps every country its true size. Imported only by the
 * map's lazy chunk, so a join page never downloads the world.
 */
const shapeSchema = z.discriminatedUnion('type', [
  z.object({
    arcs: z.array(z.array(z.number())),
    id: z.string().optional(),
    properties: z.object({ name: z.string() }),
    type: z.literal('Polygon')
  }),
  z.object({
    arcs: z.array(z.array(z.array(z.number()))),
    id: z.string().optional(),
    properties: z.object({ name: z.string() }),
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

/** A point on the drawn map, in its own units: `MAP_WIDTH` across. */
export type MapPoint = readonly [x: number, y: number]

export type ProjectedCountry = {
  code: CountryCode
  path: string
}

export type ProjectedWorld = {
  countries: readonly ProjectedCountry[]
  graticule: string
  height: number
  /** The globe's edge, which is also the sea. */
  outline: string
  width: number
}

const MAP_WIDTH = 1000
/** A tenth of a unit is under a pixel at the deepest zoom, and keeps the paths a third of their full length. */
const PATH_DIGITS = 1
const SPHERE = { type: 'Sphere' } as const

const codeOf = (shape: AtlasShape): CountryCode | null =>
  (shape.id === undefined
    ? COUNTRY_CODE_BY_ATLAS_NAME[shape.properties.name]
    : COUNTRY_CODE_BY_ATLAS_ID[shape.id]) ?? null

let projection: GeoProjection | null = null
let world: ProjectedWorld | null = null

const projectionOfTheMap = (): GeoProjection => {
  projection ??= geoEqualEarth().fitWidth(MAP_WIDTH, SPHERE)

  return projection
}

/**
 * Parsed and projected on the first call rather than at import: the chunk
 * can arrive with the round's prompt, and the work waits for the map. The
 * atlas ships with the app, so a file that does not parse is a broken build.
 */
export const projectedWorld = (): ProjectedWorld => {
  if (world !== null) {
    return world
  }

  const topology = topologySchema.parse(atlas)
  const shapesByCode = new Map<CountryCode, AtlasShape[]>()

  for (const shape of topology.objects.countries.geometries) {
    const code = codeOf(shape)

    if (code !== null) {
      shapesByCode.set(code, [...(shapesByCode.get(code) ?? []), shape])
    }
  }

  const draw = geoPath(projectionOfTheMap()).digits(PATH_DIGITS)
  const [, [, height]] = draw.bounds(SPHERE)

  world = {
    countries: [...shapesByCode].map(([code, shapes]) => ({
      code,
      path: draw(merge(topology, shapes)) ?? ''
    })),
    graticule: draw(geoGraticule10()) ?? '',
    height: Math.ceil(height),
    outline: draw(SPHERE) ?? '',
    width: MAP_WIDTH
  }

  return world
}

/** Where a geographic point is drawn. */
export const mapPointOf = ({ latitude, longitude }: GeoPoint): MapPoint => {
  const [x = 0, y = 0] = projectionOfTheMap()([longitude, latitude]) ?? []

  return [x, y]
}

/** How far a projected round trip may drift and still be the spot it started from. */
const ROUND_TRIP_TOLERANCE = 0.5

const mapPointDelta = (from: MapPoint, to: MapPoint): MapPoint => [
  from[0] - to[0],
  from[1] - to[1]
]

/**
 * The geographic point under a spot on the map, or `null` off the globe's
 * edge — the corners of the frame are not anywhere on Earth, and Equal Earth's
 * inverse answers them anyway, so the point is projected back to check.
 */
export const geoPointAt = ([x, y]: MapPoint): GeoPoint | null => {
  const inverted = projectionOfTheMap().invert?.([x, y])

  if (inverted === null || inverted === undefined) {
    return null
  }

  const [longitude, latitude] = inverted
  const isOnTheGlobe =
    Math.abs(longitude) <= 180 &&
    Math.abs(latitude) <= 90 &&
    Math.hypot(...mapPointDelta(mapPointOf({ latitude, longitude }), [x, y])) <
      ROUND_TRIP_TOLERANCE

  return isOnTheGlobe ? { latitude, longitude } : null
}
