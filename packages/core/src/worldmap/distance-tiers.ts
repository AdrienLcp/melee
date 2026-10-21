import { POINT } from '@melee/protocol/scoring'
import type { WorldmapTargetKind } from '@melee/protocol/worldmap'

type DistanceTier = { points: number; withinKm: number }

/**
 * What a marker earns by how far it fell, nearest first. Data rather than a
 * formula, because these are a table's sense of "close" and will be tuned by
 * one: inside the country is the typed answer's price, a neighbour still pays.
 * A `withinKm` of nought is *inside*, and only a country has one.
 */
export const DISTANCE_TIERS = {
  city: [
    { points: 3 * POINT, withinKm: 25 },
    { points: 2 * POINT, withinKm: 75 },
    { points: POINT, withinKm: 150 }
  ],
  country: [
    { points: 3 * POINT, withinKm: 0 },
    { points: 2 * POINT, withinKm: 500 },
    { points: POINT, withinKm: 1_500 }
  ]
} as const satisfies Record<WorldmapTargetKind, readonly DistanceTier[]>

/** What a marker this far from its target earns, before the clock adds to it. */
export const pointsForDistance = ({
  distanceKm,
  target
}: {
  distanceKm: number
  target: WorldmapTargetKind
}): number =>
  DISTANCE_TIERS[target].find(({ withinKm }: DistanceTier) =>
    withinKm === 0 ? distanceKm === 0 : distanceKm < withinKm
  )?.points ?? 0

/** Whether a marker earned the whole of what the map pays, which is what closes typed mode for it. */
export const isBullseye = (verdict: {
  distanceKm: number
  target: WorldmapTargetKind
}): boolean =>
  pointsForDistance(verdict) === DISTANCE_TIERS[verdict.target][0].points
