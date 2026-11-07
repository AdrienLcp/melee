import type { AtlasTargetKind } from '@melee/protocol/atlas'

import { paidShare } from '../scoring/round-share'

type DistanceReach = {
  /** Anywhere this near pays the whole round; nought is *inside*, and only a country has one. */
  fullPayKm: number
  /** From here on a marker pays nothing. */
  zeroPayKm: number
}

/**
 * How near a marker must fall to be paid, by what it was aimed at: 50 km is a
 * near miss of a country and a far one of a city. Between the two edges the
 * pay falls in a straight line, so 1 km and 499 km never pay the same and no
 * edge makes a cliff — the steps it replaced paid a pin 400 km off placed in
 * two seconds more than one inside the country placed at twenty-five.
 */
export const DISTANCE_REACH = {
  capital: { fullPayKm: 100, zeroPayKm: 1_000 },
  city: { fullPayKm: 25, zeroPayKm: 150 },
  country: { fullPayKm: 0, zeroPayKm: 1_500 }
} as const satisfies Record<AtlasTargetKind, DistanceReach>

/** What a marker this far from its target earns, before the clock takes its share. */
export const pointsForDistance = ({
  distanceKm,
  target
}: {
  distanceKm: number
  target: AtlasTargetKind
}): number => {
  const { fullPayKm, zeroPayKm } = DISTANCE_REACH[target]

  return paidShare(1 - (distanceKm - fullPayKm) / (zeroPayKm - fullPayKm))
}

/** Whether a marker earned the whole of what the map pays, which is what closes typed mode for it. */
export const isBullseye = ({
  distanceKm,
  target
}: {
  distanceKm: number
  target: AtlasTargetKind
}): boolean => distanceKm <= DISTANCE_REACH[target].fullPayKm
