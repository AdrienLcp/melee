import type { GeoPoint } from '@melee/protocol/atlas'

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
 * The ring an `easy` room draws from: across a continent, or across France,
 * where a decoy is a place nobody would confuse with the answer.
 */
const WIDE_DECOY_POOL_SIZE = 40

/**
 * Three places near `from`, drawn among its nearest — four African countries,
 * four Breton towns — or, `isWide`, among a ring wide enough to soften the
 * pick. `from` itself is left out by its point.
 */
export const nearbyDecoys = <TPlace extends { point: GeoPoint }>({
  candidates,
  count,
  from,
  isWide
}: {
  candidates: readonly TPlace[]
  count: number
  from: GeoPoint
  isWide: boolean
}): TPlace[] => {
  const byDistance = candidates
    .map((place) => ({ distanceKm: greatCircleKm(from, place.point), place }))
    .filter(({ distanceKm }) => distanceKm > 0)
    .toSorted((one, other) => one.distanceKm - other.distanceKm)
    .slice(0, Math.max(count, isWide ? WIDE_DECOY_POOL_SIZE : DECOY_POOL_SIZE))
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
