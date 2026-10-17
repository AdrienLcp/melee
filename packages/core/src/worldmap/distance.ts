import type { GeoPoint } from '@melee/protocol/worldmap'

/** The mean Earth radius, which is what a table means by « à 480 km ». */
export const EARTH_RADIUS_KM = 6371

/** One position of a GeoJSON ring: longitude first, in degrees. */
export type Position = readonly [longitude: number, latitude: number]

/** A closed GeoJSON ring: its last position repeats its first. */
export type Ring = readonly Position[]

type Vector = readonly [number, number, number]

const RADIANS_PER_DEGREE = Math.PI / 180

const unitVector = ([longitude, latitude]: Position): Vector => {
  const lambda = longitude * RADIANS_PER_DEGREE
  const phi = latitude * RADIANS_PER_DEGREE

  return [
    Math.cos(phi) * Math.cos(lambda),
    Math.cos(phi) * Math.sin(lambda),
    Math.sin(phi)
  ]
}

const dot = (a: Vector, b: Vector): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

const cross = (a: Vector, b: Vector): Vector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
]

const norm = (a: Vector): number => Math.sqrt(dot(a, a))

/** The angle between two unit vectors, stable for the tiny ones a border is made of. */
const angleBetween = (a: Vector, b: Vector): number =>
  Math.atan2(norm(cross(a, b)), dot(a, b))

const positionOf = ({ latitude, longitude }: GeoPoint): Position => [
  longitude,
  latitude
]

/** The great-circle distance between two points, in kilometres. */
export const greatCircleKm = (from: GeoPoint, to: GeoPoint): number =>
  angleBetween(unitVector(positionOf(from)), unitVector(positionOf(to))) *
  EARTH_RADIUS_KM

/**
 * The angle from `point` to the arc `a`–`b`: to the foot of the
 * perpendicular when it falls on the arc, to the nearer end otherwise.
 */
const angleToArc = (point: Vector, a: Vector, b: Vector): number => {
  const normal = cross(a, b)
  const normalLength = norm(normal)
  const toEnds = Math.min(angleBetween(point, a), angleBetween(point, b))

  if (normalLength === 0) {
    return toEnds
  }

  const unitNormal: Vector = [
    normal[0] / normalLength,
    normal[1] / normalLength,
    normal[2] / normalLength
  ]
  const offPlane = dot(point, unitNormal)
  const foot: Vector = [
    point[0] - offPlane * unitNormal[0],
    point[1] - offPlane * unitNormal[1],
    point[2] - offPlane * unitNormal[2]
  ]
  const footFallsOnArc =
    dot(cross(a, foot), unitNormal) >= 0 && dot(cross(foot, b), unitNormal) >= 0

  return footFallsOnArc ? Math.abs(Math.asin(offPlane)) : toEnds
}

/** The shortest distance from a point to any edge of the rings, in kilometres. */
export const distanceToRingsKm = (
  point: GeoPoint,
  rings: readonly Ring[]
): number => {
  const target = unitVector(positionOf(point))
  let nearest = Math.PI

  for (const ring of rings) {
    const vectors = ring.map(unitVector)

    for (let index = 1; index < vectors.length; index++) {
      const previous = vectors[index - 1]
      const current = vectors[index]

      if (previous !== undefined && current !== undefined) {
        nearest = Math.min(nearest, angleToArc(target, previous, current))
      }
    }
  }

  return nearest * EARTH_RADIUS_KM
}

/** A country as the judging reads it: whether a point is in it, and where its edges run. */
export type CountryShape = {
  /** The atlas's call, on the sphere — inside is decided where the shapes are read. */
  contains: (point: GeoPoint) => boolean
  /** Its outlines, islands and holes alike. */
  rings: readonly Ring[]
}

/** How far a point lies from a country: nought inside it, to its nearest border otherwise. */
export const distanceToCountryKm = ({
  point,
  shape
}: {
  point: GeoPoint
  shape: CountryShape
}): number =>
  shape.contains(point) ? 0 : distanceToRingsKm(point, shape.rings)
