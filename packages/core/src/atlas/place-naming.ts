import type { GeoPoint } from '@melee/protocol/atlas'
import type { Difficulty } from '@melee/protocol/difficulty'

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
 * The ring an `easy` room draws from: across a continent, where a decoy is a
 * place nobody would confuse with the answer.
 */
const WIDE_DECOY_POOL_SIZE = 40

/**
 * Three places near `from`, drawn among its nearest — four African countries,
 * four Baltic capitals — or, `isWide`, among a ring wide enough to soften the
 * pick. The world map frames a round on its region, so neighbours stay apart
 * on screen. `from` itself is left out by its point.
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

/**
 * How far apart a city round's four names sit, as a share of the diagonal of
 * the map's cities. A country's map is never zoomed on a city, so four
 * neighbours sit under one dot and the pick asks for a magnifying glass: the
 * spread is what makes the dot readable, and an `easy` room spreads them
 * across the country.
 */
const SPREAD_SHARE = {
  easy: 0.25,
  hard: 0.08,
  mixed: 0.15
} as const satisfies Record<Difficulty, number>

/** How much the spread gives way when a draw finds no room at the one asked. */
const SPREAD_RELAXED = 0.75

const diagonalKmOf = (points: readonly GeoPoint[]): number => {
  const latitudes = points.map(({ latitude }) => latitude)
  const longitudes = points.map(({ longitude }) => longitude)

  return points.length === 0
    ? 0
    : greatCircleKm(
        {
          latitude: Math.min(...latitudes),
          longitude: Math.min(...longitudes)
        },
        {
          latitude: Math.max(...latitudes),
          longitude: Math.max(...longitudes)
        }
      )
}

const spreadDraw = <TPlace extends { point: GeoPoint }>({
  count,
  from,
  leastKm,
  order
}: {
  count: number
  from: GeoPoint
  leastKm: number
  order: readonly TPlace[]
}): TPlace[] => {
  const picked: TPlace[] = []

  for (const place of order) {
    const isApart = [from, ...picked.map(({ point }) => point)].every(
      (point) => greatCircleKm(point, place.point) >= leastKm
    )

    if (picked.length < count && isApart) {
      picked.push(place)
    }
  }

  return picked
}

/**
 * Three cities drawn at random across the map of `from`, each at least a
 * share of the map's span from `from` and from each other — a share
 * `difficulty` sets, which gives way only when the map has no room for it.
 * `from` itself is left out by its point.
 */
export const spreadDecoys = <TPlace extends { point: GeoPoint }>({
  candidates,
  count,
  difficulty,
  from
}: {
  candidates: readonly TPlace[]
  count: number
  difficulty: Difficulty
  from: GeoPoint
}): TPlace[] => {
  const others = shuffled(
    candidates.filter(({ point }) => greatCircleKm(from, point) > 0)
  )
  const asked =
    diagonalKmOf(candidates.map(({ point }) => point)) *
    SPREAD_SHARE[difficulty]

  const drawAt = (leastKm: number): TPlace[] => {
    const drawn = spreadDraw({ count, from, leastKm, order: others })

    return drawn.length >= Math.min(count, others.length) || leastKm < 1
      ? drawn
      : drawAt(leastKm * SPREAD_RELAXED)
  }

  return drawAt(asked)
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
