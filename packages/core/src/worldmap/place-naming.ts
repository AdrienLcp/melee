import type { GeoPoint } from '@melee/protocol/worldmap'

import { shuffled } from '../helpers/random'
import { greatCircleKm } from './distance'

/**
 * How many of a place's nearest neighbours its decoys are drawn from. Three
 * of the nearest three would deal Belgium the same rivals every evening; a
 * pool much wider reaches across a continent, where a decoy gives the answer
 * away.
 */
const DECOY_POOL_SIZE = 8

/**
 * Three places near `from`, drawn among its nearest — four African countries,
 * four Breton towns. `from` itself is left out by its point.
 */
export const nearbyDecoys = <TPlace extends { point: GeoPoint }>({
  candidates,
  count,
  from
}: {
  candidates: readonly TPlace[]
  count: number
  from: GeoPoint
}): TPlace[] => {
  const byDistance = candidates
    .map((place) => ({ distanceKm: greatCircleKm(from, place.point), place }))
    .filter(({ distanceKm }) => distanceKm > 0)
    .toSorted((one, other) => one.distanceKm - other.distanceKm)
    .slice(0, Math.max(count, DECOY_POOL_SIZE))
    .map(({ place }) => place)

  return shuffled(byDistance).slice(0, count)
}

const SAINT = /\bSainte?-/gu

/**
 * A place's name and the abbreviations a table types for it —
 * *Saint-Étienne* is *St-Étienne* as often as not, and the forgiveness of a
 * typo stops well short of three letters.
 */
export const spellingsOf = (name: string): string[] => {
  const abbreviated = name.replace(SAINT, (saint) =>
    saint === 'Sainte-' ? 'Ste-' : 'St-'
  )

  return abbreviated === name ? [name] : [name, abbreviated]
}
