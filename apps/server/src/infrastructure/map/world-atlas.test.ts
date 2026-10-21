import { describe, expect, it } from 'vitest'

import { distanceToCountryKm } from '@melee/core/worldmap/distance'

import { BANKED_CITIES } from '@/infrastructure/questions/city-bank'
import { BANKED_COUNTRIES } from '@/infrastructure/questions/country-bank'

import { countryShapeOf } from './world-atlas'

const PARIS = { latitude: 48.8566, longitude: 2.3522 }
const INLAND_CORSICA = { latitude: 42.3061, longitude: 9.1503 }
const OFF_BRITTANY = { latitude: 48, longitude: -6.5 }
const MASERU = { latitude: -29.31, longitude: 27.48 }

const shapeOf = (code: Parameters<typeof countryShapeOf>[0]) => {
  const shape = countryShapeOf(code)

  if (shape === null) {
    throw new Error(`The atlas draws no ${code}`)
  }

  return shape
}

describe('the atlas the server measures against', () => {
  it('[worldmap] draws every country the bank can ask for', () => {
    const undrawn = BANKED_COUNTRIES.filter(
      (code) => countryShapeOf(code) === null
    )

    expect(undrawn).toEqual([])
  })

  it('[worldmap] puts Paris inside France, and Corsica with it', () => {
    expect(shapeOf('FRA').contains(PARIS)).toBe(true)
    expect(shapeOf('FRA').contains(INLAND_CORSICA)).toBe(true)
  })

  it('[worldmap] measures the sea off Brittany to the French coast', () => {
    const distanceKm = distanceToCountryKm({
      point: OFF_BRITTANY,
      shape: shapeOf('FRA')
    })

    expect(distanceKm).toBeGreaterThan(80)
    expect(distanceKm).toBeLessThan(200)
  })

  // Lesotho is a hole in South Africa: a marker on Maseru is surrounded by
  // South Africa and still outside it, a short way from its border.
  it('[worldmap] keeps a country out of the hole another one makes in it', () => {
    expect(shapeOf('LSO').contains(MASERU)).toBe(true)
    expect(shapeOf('ZAF').contains(MASERU)).toBe(false)

    const distanceKm = distanceToCountryKm({
      point: MASERU,
      shape: shapeOf('ZAF')
    })

    expect(distanceKm).toBeGreaterThan(0)
    expect(distanceKm).toBeLessThan(20)
  })
})

/** A coastal town's hall can stand a little off a coastline drawn at 1:50m. */
const COASTLINE_SLACK_KM = 5

describe('the French cities the bank asks for', () => {
  it('[worldmap] stands every one of them in France, so a typo in a coordinate cannot ask for the sea', () => {
    const france = shapeOf('FRA')
    const astray = BANKED_CITIES.filter(
      ({ point }) =>
        distanceToCountryKm({ point, shape: france }) > COASTLINE_SLACK_KM
    ).map(({ name }) => name)

    expect(astray).toEqual([])
  })

  it('[worldmap] names every city once, since the name is what stops it being asked twice', () => {
    const names = BANKED_CITIES.map(({ name }) => name)

    expect(new Set(names).size).toBe(names.length)
  })
})
