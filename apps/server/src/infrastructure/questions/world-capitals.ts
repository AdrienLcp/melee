import type { CountryCode } from '@melee/protocol/country-code'
import type { GeoPoint } from '@melee/protocol/worldmap'

import { pickRandom } from '@melee/core/helpers/random'

import { bankedCapitals } from './capital-bank'
import { BANKED_COUNTRIES } from './country-bank'

/** A capital a map round may ask a table to place on the world. */
export type BankedCapital = {
  countryCode: CountryCode
  names: { en: string; fr: string }
  point: GeoPoint
}

const BANKED_COUNTRY_CODES: ReadonlySet<CountryCode> = new Set(BANKED_COUNTRIES)

/**
 * The capitals of the countries the map already asks, so its sense of fair is
 * decided once: a microstate's capital is a fine point, but its country was
 * left out for being unknown too. A banked country the capital bank leaves out
 * — Israel, Greenland — has none to ask.
 */
export const worldCapitals = (): readonly BankedCapital[] =>
  bankedCapitals()
    .filter(({ code }) => BANKED_COUNTRY_CODES.has(code))
    .map(({ capital, code }) => ({
      countryCode: code,
      names: capital.names,
      point: capital.point
    }))

/** The id a played capital takes in the room's no-repeat set, beside the countries and the cities. */
export const playedCapitalId = (code: CountryCode): string =>
  `worldmap:capital:${code}`

/** A capital the room has not been asked yet, or `null` once it has placed them all. */
export const drawCapital = ({
  playedIds
}: {
  playedIds: ReadonlySet<string>
}): BankedCapital | null =>
  pickRandom(
    worldCapitals().filter(
      ({ countryCode }) => !playedIds.has(playedCapitalId(countryCode))
    )
  )
