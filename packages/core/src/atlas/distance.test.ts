import { describe, expect, it } from 'vitest'

import {
  type CountryShape,
  distanceToCountryKm,
  distanceToRingsKm,
  EARTH_RADIUS_KM,
  greatCircleKm,
  nearestPointOnRings,
  type Ring
} from './distance'

const PARIS = { latitude: 48.8566, longitude: 2.3522 }
const RENNES = { latitude: 48.1173, longitude: -1.6778 }

/** One degree along the equator, on the mean radius. */
const KM_PER_DEGREE = 111.195

/** A square resting on the equator, from the meridian to 10°E. */
const SQUARE: Ring = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0]
]

/** An island west of the date line, its east coast on it: the half of Fiji the atlas draws at 180°. */
const WEST_OF_THE_DATE_LINE: Ring = [
  [177, -18],
  [180, -18],
  [180, -16],
  [177, -16],
  [177, -18]
]

const RADIANS = Math.PI / 180

describe('the distance between two places', () => {
  it('[atlas] measures Paris to Rennes along the globe', () => {
    expect(greatCircleKm(PARIS, RENNES)).toBeGreaterThan(305)
    expect(greatCircleKm(PARIS, RENNES)).toBeLessThan(311)
  })

  it('[atlas] reads the same both ways', () => {
    expect(greatCircleKm(RENNES, PARIS)).toBeCloseTo(
      greatCircleKm(PARIS, RENNES),
      9
    )
  })

  it('[atlas] crosses the date line the short way', () => {
    const across = greatCircleKm(
      { latitude: 65, longitude: 179 },
      { latitude: 65, longitude: -179 }
    )

    expect(across).toBeGreaterThan(90)
    expect(across).toBeLessThan(2 * KM_PER_DEGREE * Math.cos(65 * RADIANS))
  })
})

describe('the distance to an outline', () => {
  it('[atlas] drops a perpendicular onto the edge it faces', () => {
    const point = { latitude: -5, longitude: 5 }

    expect(distanceToRingsKm(point, [SQUARE])).toBeCloseTo(5 * KM_PER_DEGREE, 0)
  })

  // Past the end of every edge, the nearest thing is a corner, and a
  // perpendicular onto the edge's great circle would land off the country.
  it('[atlas] measures to the corner when no edge faces the point', () => {
    const point = { latitude: -5, longitude: -5 }

    expect(distanceToRingsKm(point, [SQUARE])).toBeCloseTo(
      greatCircleKm(point, { latitude: 0, longitude: 0 }),
      6
    )
  })

  it('[atlas] takes the nearest of several islands', () => {
    const farIsland: Ring = [
      [100, 0],
      [101, 0],
      [101, 1],
      [100, 0]
    ]
    const point = { latitude: -5, longitude: 5 }

    expect(distanceToRingsKm(point, [farIsland, SQUARE])).toBeCloseTo(
      distanceToRingsKm(point, [SQUARE]),
      9
    )
  })

  it('[atlas] reaches an island across the date line from the other side', () => {
    const samoa = { latitude: -17, longitude: -178 }

    expect(distanceToRingsKm(samoa, [WEST_OF_THE_DATE_LINE])).toBeCloseTo(
      Math.asin(Math.cos(17 * RADIANS) * Math.sin(2 * RADIANS)) *
        EARTH_RADIUS_KM,
      1
    )
  })
})

describe('the point of an outline a distance ends on', () => {
  it('[atlas] is the foot of the perpendicular on the edge it faces', () => {
    const nearest = nearestPointOnRings({ latitude: -5, longitude: 5 }, [
      SQUARE
    ])

    expect(nearest?.latitude).toBeCloseTo(0, 9)
    expect(nearest?.longitude).toBeCloseTo(5, 9)
  })

  it('[atlas] is the corner when no edge faces the point', () => {
    const nearest = nearestPointOnRings({ latitude: -5, longitude: -5 }, [
      SQUARE
    ])

    expect(nearest?.latitude).toBeCloseTo(0, 9)
    expect(nearest?.longitude).toBeCloseTo(0, 9)
  })

  it('[atlas] lies on the date line for a point just across it', () => {
    const nearest = nearestPointOnRings({ latitude: -17, longitude: -178 }, [
      WEST_OF_THE_DATE_LINE
    ])

    expect(Math.abs(nearest?.longitude ?? 0)).toBeCloseTo(180, 9)
    expect(nearest?.latitude).toBeCloseTo(-17, 1)
  })

  it('[atlas] is the one the distance was measured to', () => {
    const point = { latitude: 30, longitude: 40 }
    const nearest = nearestPointOnRings(point, [SQUARE])

    expect(nearest === null ? null : greatCircleKm(point, nearest)).toBeCloseTo(
      distanceToRingsKm(point, [SQUARE]),
      6
    )
  })

  it('[atlas] is none for an outline with no edge', () => {
    expect(nearestPointOnRings({ latitude: 0, longitude: 0 }, [])).toBeNull()
  })
})

describe('the distance to a country', () => {
  const shapeInsideWhen = (isInside: boolean): CountryShape => ({
    contains: () => isInside,
    rings: [SQUARE]
  })

  it('[atlas] is nought for a point inside, however far the border', () => {
    const point = { latitude: 5, longitude: 5 }

    expect(distanceToCountryKm({ point, shape: shapeInsideWhen(true) })).toBe(0)
  })

  it('[atlas] is the way to the border for a point outside', () => {
    const point = { latitude: -5, longitude: 5 }

    expect(
      distanceToCountryKm({ point, shape: shapeInsideWhen(false) })
    ).toBeCloseTo(5 * KM_PER_DEGREE, 0)
  })
})
