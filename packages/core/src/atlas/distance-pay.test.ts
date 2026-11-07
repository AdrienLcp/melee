import { describe, expect, it } from 'vitest'

import { MOST_A_ROUND_PAYS, POINT } from '@melee/protocol/scoring'

import { clockedPay } from '../scoring/speed-bonus'
import { isBullseye, pointsForDistance } from './distance-pay'

const country = (distanceKm: number) =>
  pointsForDistance({ distanceKm, target: 'country' })

const city = (distanceKm: number) =>
  pointsForDistance({ distanceKm, target: 'city' })

const capital = (distanceKm: number) =>
  pointsForDistance({ distanceKm, target: 'capital' })

describe('what a marker earns by how far it fell from a country', () => {
  it('[atlas] pays the whole round inside the country', () => {
    expect(country(0)).toBe(MOST_A_ROUND_PAYS)
  })

  it('[atlas] falls in a straight line, so no two distances pay the same', () => {
    expect(country(1)).toBe(99_933)
    expect(country(375)).toBe(75 * POINT)
    expect(country(750)).toBe(50 * POINT)
    expect(country(1_499)).toBe(67)
    expect(country(499)).toBeGreaterThan(country(500))
  })

  it('[atlas] pays nothing from the edge of its reach', () => {
    expect(country(1_500)).toBe(0)
    expect(country(20_000)).toBe(0)
  })

  /**
   * The game night's case: A clicked inside at 25 s of 30, B fell 400 km off
   * at 2 s. The steps paid B more; the closer marker has to win.
   */
  it('[atlas] pays the closer marker more than the faster one', () => {
    const roundDurationMs = 30_000
    const inside = clockedPay({
      earned: country(0),
      elapsedMs: 25_000,
      roundDurationMs
    })
    const offButFast = clockedPay({
      earned: country(400),
      elapsedMs: 2_000,
      roundDurationMs
    })

    expect(inside.points).toBe(91_667)
    expect(offButFast.points).toBe(72_844)
  })
})

describe('what a marker earns by how far it fell from a city', () => {
  it('[atlas] pays the whole round anywhere near the city, not only on it', () => {
    expect(city(0)).toBe(MOST_A_ROUND_PAYS)
    expect(city(25)).toBe(MOST_A_ROUND_PAYS)
  })

  it('[atlas] falls to nothing over a reach a country would call a bullseye', () => {
    expect(city(87.5)).toBe(50 * POINT)
    expect(city(150)).toBe(0)
  })

  it('[atlas] calls a bullseye whatever earns the whole round', () => {
    expect(isBullseye({ distanceKm: 25, target: 'city' })).toBe(true)
    expect(isBullseye({ distanceKm: 26, target: 'city' })).toBe(false)
    expect(isBullseye({ distanceKm: 0, target: 'country' })).toBe(true)
    expect(isBullseye({ distanceKm: 1, target: 'country' })).toBe(false)
  })
})

describe('what a marker earns by how far it fell from a capital', () => {
  it('[atlas] pays the whole round near enough the city', () => {
    expect(capital(0)).toBe(MOST_A_ROUND_PAYS)
    expect(capital(100)).toBe(MOST_A_ROUND_PAYS)
  })

  it('[atlas] pays the big city taken for the capital less, the further it is', () => {
    expect(capital(550)).toBe(50 * POINT)
    expect(capital(1_000)).toBe(0)
  })
})
