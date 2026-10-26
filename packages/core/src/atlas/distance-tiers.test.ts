import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import { isBullseye, pointsForDistance } from './distance-tiers'

const country = (distanceKm: number) =>
  pointsForDistance({ distanceKm, target: 'country' })

const city = (distanceKm: number) =>
  pointsForDistance({ distanceKm, target: 'city' })

const capital = (distanceKm: number) =>
  pointsForDistance({ distanceKm, target: 'capital' })

describe('what a marker earns by how far it fell from a country', () => {
  it('[atlas] pays the typed answer’s price inside the country', () => {
    expect(country(0)).toBe(3 * POINT)
  })

  it('[atlas] still pays a neighbour, less the further it falls', () => {
    expect(country(1)).toBe(2 * POINT)
    expect(country(499)).toBe(2 * POINT)
    expect(country(500)).toBe(POINT)
    expect(country(1_499)).toBe(POINT)
  })

  it('[atlas] pays nothing past the last tier', () => {
    expect(country(1_500)).toBe(0)
    expect(country(20_000)).toBe(0)
  })
})

describe('what a marker earns by how far it fell from a city', () => {
  it('[atlas] pays the whole price anywhere near the city, not only on it', () => {
    expect(city(0)).toBe(3 * POINT)
    expect(city(24)).toBe(3 * POINT)
  })

  it('[atlas] prices a city by tiers a country would call a bullseye', () => {
    expect(city(25)).toBe(2 * POINT)
    expect(city(74)).toBe(2 * POINT)
    expect(city(75)).toBe(POINT)
    expect(city(149)).toBe(POINT)
    expect(city(150)).toBe(0)
  })

  it('[atlas] calls a bullseye whatever earns the first tier', () => {
    expect(isBullseye({ distanceKm: 24, target: 'city' })).toBe(true)
    expect(isBullseye({ distanceKm: 25, target: 'city' })).toBe(false)
    expect(isBullseye({ distanceKm: 0, target: 'country' })).toBe(true)
    expect(isBullseye({ distanceKm: 1, target: 'country' })).toBe(false)
  })
})

describe('what a marker earns by how far it fell from a capital', () => {
  it('[atlas] pays the whole price inside the right country, near enough the city', () => {
    expect(capital(0)).toBe(3 * POINT)
    expect(capital(99)).toBe(3 * POINT)
  })

  it('[atlas] pays the big city taken for the capital at least a tier less', () => {
    expect(capital(100)).toBe(2 * POINT)
    expect(capital(299)).toBe(2 * POINT)
    expect(capital(300)).toBe(POINT)
    expect(capital(999)).toBe(POINT)
    expect(capital(1_000)).toBe(0)
  })
})
