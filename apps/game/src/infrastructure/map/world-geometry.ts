import {
  type GeoProjection,
  geoBounds,
  geoConicConformal,
  geoContains,
  geoEqualEarth,
  geoGraticule,
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
 * against, so a coastline on screen is the coastline that scores. The world is
 * drawn in Equal Earth, which keeps every country its true size; France in the
 * conic conformal its own maps use, which keeps a city's surroundings their
 * true shape. Imported only by the map's lazy chunk, so a join page never
 * downloads the world.
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

/** A country as the reveal points at it, in map units. */
export type CountryOutline = {
  /** In map units squared: times the view's scale squared, what it covers on screen. */
  area: number
  /** Its main landmass: France framed without Guiana, Chile without Easter Island. */
  box: { max: MapPoint; min: MapPoint }
  centre: MapPoint
  /** Every border point, overseas parts included, since the server measures to all of them. */
  vertices: readonly MapPoint[]
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

type Outline = ReturnType<typeof merge>

let outlinesByCode: ReadonlyMap<CountryCode, Outline> | null = null

/**
 * Parsed on the first call rather than at import: the chunk can arrive with
 * the round's prompt, and the work waits for the map. The atlas ships with
 * the app, so a file that does not parse is a broken build.
 */
const countryOutlines = (): ReadonlyMap<CountryCode, Outline> => {
  if (outlinesByCode !== null) {
    return outlinesByCode
  }

  const topology = topologySchema.parse(atlas)
  const shapesByCode = new Map<CountryCode, AtlasShape[]>()

  for (const shape of topology.objects.countries.geometries) {
    const code = codeOf(shape)

    if (code !== null) {
      shapesByCode.set(code, [...(shapesByCode.get(code) ?? []), shape])
    }
  }

  outlinesByCode = new Map(
    [...shapesByCode].map(([code, shapes]) => [code, merge(topology, shapes)])
  )

  return outlinesByCode
}

/** Which map a round is played on: the world for a country, France for one of its cities. */
export type MapRegion = 'france' | 'world'

/** One map's projection and everything drawn or measured through it. */
export type MapGeometry = {
  /** The country drawn on this map that holds a point, or `null` at sea. */
  countryAt: (point: GeoPoint) => CountryCode | null
  /** The country's outline projected, or `null` for a code the atlas does not draw. */
  countryOutlineOf: (code: CountryCode) => CountryOutline | null
  /**
   * The geographic point under a spot on the map, or `null` off it — the
   * corners of the world's frame are not anywhere on Earth, and Equal Earth's
   * inverse answers them anyway, so the point is projected back to check.
   */
  geoPointAt: (at: MapPoint) => GeoPoint | null
  /** Where a geographic point is drawn. */
  mapPointOf: (point: GeoPoint) => MapPoint
  projected: ProjectedWorld
}

/** How far a projected round trip may drift and still be the spot it started from. */
const ROUND_TRIP_TOLERANCE = 0.5

/**
 * Metropolitan France and Corsica with a margin of sea and neighbours, as the
 * points the conic projection is fitted to: its corners and the middles of its
 * long edges, since a parallel bows under a conic projection.
 */
const FRANCE_FRAME = {
  coordinates: [
    [-5.8, 41.2],
    [2.2, 41.2],
    [10.2, 41.2],
    [-5.8, 51.3],
    [2.2, 51.3],
    [10.2, 51.3]
  ],
  type: 'MultiPoint'
} satisfies GeoJSON.MultiPoint

/** The standard parallels of France's own Lambert maps, and its middle meridian. */
const FRANCE_PARALLELS: [number, number] = [44, 49]
const FRANCE_MERIDIAN = 3

/** The countries worth drawing around France: any whose box reaches this one. */
const FRANCE_SURROUNDINGS = { east: 16, north: 55, south: 38, west: -12 }

const reachesFranceSurroundings = (outline: Outline): boolean => {
  const [[west, south], [east, north]] = geoBounds(outline)
  // A box whose west edge is east of its east edge crosses the antimeridian, and spans every longitude.
  const spansEveryLongitude = west > east

  return (
    south <= FRANCE_SURROUNDINGS.north &&
    north >= FRANCE_SURROUNDINGS.south &&
    (spansEveryLongitude ||
      (west <= FRANCE_SURROUNDINGS.east && east >= FRANCE_SURROUNDINGS.west))
  )
}

const geometryOver = ({
  graticule,
  height,
  isOnTheMap,
  outline,
  outlines,
  projection
}: {
  graticule: GeoJSON.MultiLineString
  height: number
  /** Whether a spot of the frame is somewhere this map draws. */
  isOnTheMap: (at: MapPoint) => boolean
  /** The map's edge, which is also the sea. */
  outline: string
  outlines: ReadonlyMap<CountryCode, Outline>
  projection: GeoProjection
}): MapGeometry => {
  const draw = geoPath(projection).digits(PATH_DIGITS)
  const measure = geoPath(projection)

  const mapPointOf = ({ latitude, longitude }: GeoPoint): MapPoint => {
    const [x = 0, y = 0] = projection([longitude, latitude]) ?? []

    return [x, y]
  }

  return {
    countryAt: ({ latitude, longitude }) =>
      [...outlines].find(([, countryOutline]) =>
        geoContains(countryOutline, [longitude, latitude])
      )?.[0] ?? null,
    countryOutlineOf: (code) => {
      const countryOutline = countryOutlines().get(code)

      if (countryOutline === undefined) {
        return null
      }

      const landmasses = countryOutline.coordinates.map(
        (coordinates) => ({ coordinates, type: 'Polygon' }) as const
      )
      const mainland = landmasses.toSorted(
        (left, right) => measure.area(right) - measure.area(left)
      )[0]
      const [[minX, minY], [maxX, maxY]] = measure.bounds(
        mainland ?? countryOutline
      )

      return {
        area: measure.area(countryOutline),
        box: { max: [maxX, maxY], min: [minX, minY] },
        centre: measure.centroid(mainland ?? countryOutline),
        vertices: countryOutline.coordinates
          .flat(2)
          .map(([longitude = 0, latitude = 0]) =>
            mapPointOf({ latitude, longitude })
          )
      }
    },
    geoPointAt: (at) => {
      const inverted = projection.invert?.([at[0], at[1]])

      if (inverted === null || inverted === undefined || !isOnTheMap(at)) {
        return null
      }

      const [longitude, latitude] = inverted
      const [x, y] = mapPointOf({ latitude, longitude })
      const isOnTheGlobe =
        Math.abs(longitude) <= 180 &&
        Math.abs(latitude) <= 90 &&
        Math.hypot(x - at[0], y - at[1]) < ROUND_TRIP_TOLERANCE

      return isOnTheGlobe ? { latitude, longitude } : null
    },
    mapPointOf,
    projected: {
      countries: [...outlines].map(([code, countryOutline]) => ({
        code,
        path: draw(countryOutline) ?? ''
      })),
      graticule: draw(graticule) ?? '',
      height: Math.ceil(height),
      outline,
      width: MAP_WIDTH
    }
  }
}

const worldGeometry = (): MapGeometry => {
  const projection = geoEqualEarth().fitWidth(MAP_WIDTH, SPHERE)
  const draw = geoPath(projection).digits(PATH_DIGITS)
  const [, [, height]] = draw.bounds(SPHERE)

  return geometryOver({
    graticule: geoGraticule10(),
    height,
    isOnTheMap: () => true,
    outline: draw(SPHERE) ?? '',
    outlines: countryOutlines(),
    projection
  })
}

/**
 * France framed edge to edge: the frame is a rectangle of the projection
 * rather than the globe's rim, so every country is cut to it and only the
 * ones reaching it are drawn at all.
 */
const franceGeometry = (): MapGeometry => {
  const projection = geoConicConformal()
    .parallels(FRANCE_PARALLELS)
    .rotate([-FRANCE_MERIDIAN, 0])
    .fitWidth(MAP_WIDTH, FRANCE_FRAME)
  const [, [, frameBottom]] = geoPath(projection).bounds(FRANCE_FRAME)
  const height = Math.ceil(frameBottom)

  projection.clipExtent([
    [0, 0],
    [MAP_WIDTH, height]
  ])

  return geometryOver({
    graticule: geoGraticule().step([2, 2])(),
    height,
    isOnTheMap: ([x, y]) => x >= 0 && x <= MAP_WIDTH && y >= 0 && y <= height,
    outline: `M0,0H${MAP_WIDTH}V${height}H0Z`,
    outlines: new Map(
      [...countryOutlines()].filter(([, countryOutline]) =>
        reachesFranceSurroundings(countryOutline)
      )
    ),
    projection
  })
}

const geometries = new Map<MapRegion, MapGeometry>()

/** Projected on the first call for each map, and kept: a round never redraws a coastline. */
export const mapGeometryOf = (region: MapRegion): MapGeometry => {
  const known = geometries.get(region)

  if (known !== undefined) {
    return known
  }

  const geometry = region === 'world' ? worldGeometry() : franceGeometry()

  geometries.set(region, geometry)

  return geometry
}

/** The border point drawn nearest `from` — where a reveal's line ends. */
export const nearestVertex = (
  vertices: readonly MapPoint[],
  from: MapPoint
): MapPoint =>
  vertices.reduce<MapPoint>(
    (nearest, vertex) =>
      Math.hypot(vertex[0] - from[0], vertex[1] - from[1]) <
      Math.hypot(nearest[0] - from[0], nearest[1] - from[1])
        ? vertex
        : nearest,
    vertices[0] ?? from
  )
