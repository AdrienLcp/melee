import type { GeoPoint, LocalizedName } from '@melee/protocol/worldmap'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { shuffled } from '@melee/core/helpers/random'
import { nearbyDecoys, spellingsOf } from '@melee/core/worldmap/place-naming'

import type { WorldmapNaming, WorldmapRoundTarget } from '@/domain/room/room'
import { pointInsideCountry } from '@/infrastructure/map/world-atlas'

import { BANKED_CITIES } from './city-bank'
import { BANKED_COUNTRIES } from './country-bank'
import { worldCapitals } from './world-capitals'

const DECOY_COUNT = 3

type NamedPlace = { names: LocalizedName; point: GeoPoint }

const bankedCountryPlaces = (): NamedPlace[] =>
  BANKED_COUNTRIES.flatMap((code) => {
    const point = pointInsideCountry(code)

    return point === null
      ? []
      : [
          {
            names: {
              en: COUNTRY_NAMES_EN[code].name,
              fr: COUNTRY_NAMES_FR[code].name
            },
            point
          }
        ]
  })

/** The place a round shows, and the bank its decoys are its neighbours in. */
const placeAndRivalsOf = (
  target: WorldmapRoundTarget
): { place: NamedPlace; rivals: readonly NamedPlace[] } | null => {
  switch (target.kind) {
    case 'capital':
      return { place: target, rivals: worldCapitals() }
    case 'city':
      return {
        place: {
          names: { en: target.name, fr: target.name },
          point: target.point
        },
        rivals: BANKED_CITIES.map(({ name, point }) => ({
          names: { en: name, fr: name },
          point
        }))
      }
    case 'country': {
      const point = pointInsideCountry(target.countryCode)

      return point === null
        ? null
        : {
            place: {
              names: {
                en: COUNTRY_NAMES_EN[target.countryCode].name,
                fr: COUNTRY_NAMES_FR[target.countryCode].name
              },
              point
            },
            rivals: bankedCountryPlaces()
          }
    }
  }
}

const spellingsOfNames = ({ en, fr }: LocalizedName): string[] => [
  ...new Set([...spellingsOf(fr), ...spellingsOf(en)])
]

/**
 * What a `name` round asks with `target`, or `null` for a country no point of
 * which the atlas can show.
 */
export const namingOf = ({
  isChoice,
  target
}: {
  isChoice: boolean
  target: WorldmapRoundTarget
}): WorldmapNaming | null => {
  const found = placeAndRivalsOf(target)

  if (found === null) {
    return null
  }

  const answer = found.place.names
  const decoys = nearbyDecoys({
    candidates: found.rivals,
    count: DECOY_COUNT,
    from: found.place.point
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
