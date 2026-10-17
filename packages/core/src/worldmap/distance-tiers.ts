import { POINT } from '@melee/protocol/scoring'

/**
 * What a marker earns by how far it fell, nearest first. Data rather than a
 * formula, because these are a table's sense of "close" and will be tuned by
 * one: inside the country is the typed answer's price, a neighbour still pays.
 */
export const DISTANCE_TIERS = [
  { points: 3 * POINT, withinKm: 0 },
  { points: 2 * POINT, withinKm: 500 },
  { points: POINT, withinKm: 1_500 }
] as const

/** What a marker this far from the country earns, before the clock adds to it. */
export const pointsForDistance = (distanceKm: number): number =>
  DISTANCE_TIERS.find(({ withinKm }) =>
    withinKm === 0 ? distanceKm === 0 : distanceKm < withinKm
  )?.points ?? 0
