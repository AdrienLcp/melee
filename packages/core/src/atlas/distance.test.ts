import { describe, expect, it } from 'vitest'

import {
  type CountryShape,
  distanceToCountryKm,
  distanceToRingsKm,
  greatCircleKm,
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
