import type { GeoPoint } from '@melee/protocol/atlas'

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

const scaled = (a: Vector, by: number): Vector => [
  a[0] * by,
  a[1] * by,
  a[2] * by
]

/**
 * Where the perpendicular from `point` meets the great circle through `a` and
 * `b`, with how far off that circle's plane the point stands, or `null` when
 * it lands outside the arc between them.
 */
const perpendicularOnArc = (
  point: Vector,
  a: Vector,
  b: Vector
): { foot: Vector; offPlane: number } | null => {
  const normal = cross(a, b)
  const normalLength = norm(normal)

  if (normalLength === 0) {
    return null
  }

  const unitNormal = scaled(normal, 1 / normalLength)
  const offPlane = dot(point, unitNormal)
  const foot: Vector = [
    point[0] - offPlane * unitNormal[0],
    point[1] - offPlane * unitNormal[1],
    point[2] - offPlane * unitNormal[2]
  ]
  const footFallsOnArc =
    dot(cross(a, foot), unitNormal) >= 0 && dot(cross(foot, b), unitNormal) >= 0

  return footFallsOnArc ? { foot, offPlane } : null
}

/**
 * The angle from `point` to the arc `a`–`b`: to the foot of the
 * perpendicular when it falls on the arc, to the nearer end otherwise.
 */
const angleToArc = (point: Vector, a: Vector, b: Vector): number => {
  const perpendicular = perpendicularOnArc(point, a, b)

  return perpendicular === null
    ? Math.min(angleBetween(point, a), angleBetween(point, b))
    : Math.abs(Math.asin(perpendicular.offPlane))
}

/** The point of the arc `a`–`b` that `angleToArc` measures to. */
const nearestOnArc = (point: Vector, a: Vector, b: Vector): Vector => {
  const perpendicular = perpendicularOnArc(point, a, b)

  if (perpendicular === null || norm(perpendicular.foot) === 0) {
    return angleBetween(point, a) <= angleBetween(point, b) ? a : b
  }

  return scaled(perpendicular.foot, 1 / norm(perpendicular.foot))
}

type Arc = readonly [Vector, Vector]

const nearestArcOf = (
  point: Vector,
  rings: readonly Ring[]
): { angle: number; arc: Arc | null } => {
  let nearest: { angle: number; arc: Arc | null } = {
    angle: Math.PI,
    arc: null
  }

  for (const ring of rings) {
    const vectors = ring.map(unitVector)

    for (let index = 1; index < vectors.length; index++) {
      const previous = vectors[index - 1]
      const current = vectors[index]

      if (previous !== undefined && current !== undefined) {
        const angle = angleToArc(point, previous, current)

        if (angle < nearest.angle) {
          nearest = { angle, arc: [previous, current] }
        }
      }
    }
  }

  return nearest
}

/** The shortest distance from a point to any edge of the rings, in kilometres. */
export const distanceToRingsKm = (
  point: GeoPoint,
  rings: readonly Ring[]
): number =>
  nearestArcOf(unitVector(positionOf(point)), rings).angle * EARTH_RADIUS_KM

const DEGREES_PER_RADIAN = 180 / Math.PI

/**
 * The point of the rings `distanceToRingsKm` measures to — where a reveal's
 * line ends, so it ends where the score was counted — or `null` for rings
 * with no edge.
 */
export const nearestPointOnRings = (
  point: GeoPoint,
  rings: readonly Ring[]
): GeoPoint | null => {
  const target = unitVector(positionOf(point))
  const { arc } = nearestArcOf(target, rings)

  if (arc === null) {
    return null
  }

  const [x, y, z] = nearestOnArc(target, ...arc)

  return {
    latitude: Math.asin(Math.max(-1, Math.min(1, z))) * DEGREES_PER_RADIAN,
    longitude: Math.atan2(y, x) * DEGREES_PER_RADIAN
  }
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
