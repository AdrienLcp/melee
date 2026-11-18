import type { GeoPoint, LocalizedName } from '@melee/protocol/atlas'
import type { CountryCode } from '@melee/protocol/country-code'
import type { Difficulty } from '@melee/protocol/difficulty'
import { byLocale, type Locale } from '@melee/protocol/locale'

import { nearbyDecoys, spellingsOf } from '@melee/core/atlas/place-naming'
import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { COUNTRY_NAMES_PT } from '@melee/core/countries/country-names-pt'
import { shuffled } from '@melee/core/helpers/random'

import type { AtlasNaming, AtlasRoundTarget } from '@/domain/room/room'
import { pointInsideCountry } from '@/infrastructure/map/world-atlas'

import { BANKED_CITIES } from './city-bank'
import { BANKED_COUNTRIES } from './country-bank'
import { worldCapitals } from './world-capitals'

const DECOY_COUNT = 3

type NamedPlace = { names: LocalizedName; point: GeoPoint }

const COUNTRY_NAMES = {
  en: COUNTRY_NAMES_EN,
  fr: COUNTRY_NAMES_FR,
  pt: COUNTRY_NAMES_PT
} satisfies Record<Locale, unknown>

const countryNamesOf = (code: CountryCode): LocalizedName =>
  byLocale((locale) => COUNTRY_NAMES[locale][code].name)

const bankedCountryPlaces = (): NamedPlace[] =>
  BANKED_COUNTRIES.flatMap((code) => {
    const point = pointInsideCountry(code)

    return point === null
      ? []
      : [
          {
            names: countryNamesOf(code),
            point
          }
        ]
  })

/** The place a round shows, and the bank its decoys are its neighbours in. */
const placeAndRivalsOf = (
  target: AtlasRoundTarget
): { place: NamedPlace; rivals: readonly NamedPlace[] } | null => {
  switch (target.kind) {
    case 'capital':
      return { place: target, rivals: worldCapitals() }
    case 'city':
      return {
        place: {
          names: byLocale(() => target.name),
          point: target.point
        },
        rivals: BANKED_CITIES.map(({ name, point }) => ({
          names: byLocale(() => name),
          point
        }))
      }
    case 'country': {
      const point = pointInsideCountry(target.countryCode)

      return point === null
        ? null
        : {
            place: {
              names: countryNamesOf(target.countryCode),
              point
            },
            rivals: bankedCountryPlaces()
          }
    }
  }
}

const spellingsOfNames = (names: LocalizedName): string[] => [
  ...new Set([
    ...spellingsOf(names.fr),
    ...Object.values(names).flatMap((name) => spellingsOf(name))
  ])
]

/**
 * What a `name` round asks with `target`, or `null` for a country no point of
 * which the atlas can show.
 */
export const namingOf = ({
  difficulty,
  isChoice,
  target
}: {
  difficulty: Difficulty
  isChoice: boolean
  target: AtlasRoundTarget
}): AtlasNaming | null => {
  const found = placeAndRivalsOf(target)

  if (found === null) {
    return null
  }

  const answer = found.place.names
  const decoys = nearbyDecoys({
    candidates: found.rivals,
    count: DECOY_COUNT,
    from: found.place.point,
    isWide: difficulty === 'easy'
  }).map(({ names }) => names)
  const choices = isChoice ? shuffled([answer, ...decoys]) : []

  return {
    accepted: spellingsOfNames(answer),
    answer,
    choices,
    correctChoiceIndex: isChoice ? choices.indexOf(answer) : null,
    decoys,
    shown: found.place.point
  }
}
