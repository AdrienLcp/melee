import type { GeoPoint } from '@melee/protocol/atlas'
import type { CountryCode } from '@melee/protocol/country-code'
import type { Difficulty } from '@melee/protocol/difficulty'
import {
  type FiveCluesLadder,
  type M49Region,
  MOST_CLUE_CITIES,
  m49RegionSchema
} from '@melee/protocol/five-clues'
import type { Locale } from '@melee/protocol/locale'
import type {
  FlagFile,
  QuestionLanguage,
  SilhouetteFile
} from '@melee/protocol/question'
import { questionLanguages } from '@melee/protocol/question'

import { greatCircleKm } from '@melee/core/atlas/distance'
import type { QuestionAnswer } from '@melee/core/quiz/question-answer'
import { normalizeAnswer } from '@melee/core/round/answer-matching'
import { drawByDifficulty } from '@melee/core/round/difficulty-draw'

import { bankedCapitals, type CapitalRow } from './capital-bank'
import {
  acceptedCountryNames,
  COUNTRY_NAMES_BY_LANGUAGE
} from './country-answers'
import { BANKED_COUNTRIES } from './country-bank'
import { countryTierOf, flagFileOf } from './flag-questions'
import { bankedQuantities } from './quantity-bank'
import { silhouetteFileOf } from './silhouette-questions'

/** One country with every rung of its ladder, composed from the banks the other games deal. */
export type FiveCluesCountry = {
  areaSquareKilometres: number
  capital: Readonly<Record<Locale, string>>
  capitalPoint: GeoPoint
  /** Up to three, never one whose name carries the country's in any language. */
  cities: readonly Readonly<Record<Locale, string>>[]
  code: CountryCode
  /** The three countries of its clue region whose capitals lie nearest: what `choice` puts beside it. */
  decoys: readonly [CountryCode, CountryCode, CountryCode]
  flag: FlagFile
  population: number
  region: M49Region
  silhouette: SilhouetteFile
}

/**
 * The countries whose size names them on the first clue: a population of
 * 1.4 billion is China or India, 17 million km² is Russia. The first clue is
 * worth the whole round, and a round every seat wins on it is not played.
 */
const SIZE_RANKS_THAT_GIVE_IT_AWAY = 3

/**
 * A region clue must leave at least as many countries standing as `choice`
 * shows: Northern America is two, so Canada's clue names the Americas.
 */
const FEWEST_COUNTRIES_A_REGION_HIDES = 4

type ComposedCountry = Omit<FiveCluesCountry, 'decoys' | 'region'> & {
  continent: string
  subregion: string
}

const countryValuesOf = (
  family: 'area.country' | 'population.country'
): ReadonlyMap<CountryCode, number> => {
  const values = new Map<CountryCode, number>()

  for (const row of bankedQuantities()) {
    if (row.family === family && row.countryCode !== null) {
      values.set(row.countryCode, row.value)
    }
  }

  return values
}

const namesTheCountry = ({
  city,
  code
}: {
  city: CapitalRow['largestCities'][number]
  code: CountryCode
}): boolean =>
  questionLanguages.some((language) => {
    const cityName = normalizeAnswer(city.names[language])

    return [
      COUNTRY_NAMES_BY_LANGUAGE[language][code].name,
      ...acceptedCountryNames({ code, language })
    ].some((countryName) => cityName.includes(normalizeAnswer(countryName)))
  })

const composedCountries = (): ComposedCountry[] => {
  const capitals = new Map(bankedCapitals().map((row) => [row.code, row]))
  const populations = countryValuesOf('population.country')
  const areas = countryValuesOf('area.country')

  return BANKED_COUNTRIES.flatMap((code) => {
    const capitalRow = capitals.get(code)
    const population = populations.get(code)
    const areaSquareKilometres = areas.get(code)
    const flag = flagFileOf(code)
    const silhouette = silhouetteFileOf(code)
    const cities =
      capitalRow?.largestCities
        .filter((city) => !namesTheCountry({ city, code }))
        .slice(0, MOST_CLUE_CITIES)
        .map(({ names }) => names) ?? []

    if (
      capitalRow === undefined ||
      population === undefined ||
      areaSquareKilometres === undefined ||
      flag === null ||
      silhouette === null ||
      cities.length === 0
    ) {
      return []
    }

    return [
      {
        areaSquareKilometres,
        capital: capitalRow.capital.names,
        capitalPoint: capitalRow.capital.point,
        cities,
        code,
        continent: capitalRow.region,
        flag,
        population,
        silhouette,
        subregion: capitalRow.subregion
      }
    ]
  })
}

const largestBy = ({
  countries,
  measure
}: {
  countries: readonly ComposedCountry[]
  measure: (country: ComposedCountry) => number
}): CountryCode[] =>
  countries
    .toSorted((one, other) => measure(other) - measure(one))
    .slice(0, SIZE_RANKS_THAT_GIVE_IT_AWAY)
    .map(({ code }) => code)

const withoutSizeGiveaways = (
  countries: readonly ComposedCountry[]
): ComposedCountry[] => {
  const givenAway = new Set([
    ...largestBy({ countries, measure: ({ population }) => population }),
    ...largestBy({
      countries,
      measure: ({ areaSquareKilometres }) => areaSquareKilometres
    })
  ])

  return countries.filter(({ code }) => !givenAway.has(code))
}

const countOf = (values: readonly string[]): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>()

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return counts
}

type PlacedCapital = Pick<ComposedCountry, 'capitalPoint' | 'code'>

const nearestDecoys = ({
  country,
  sameRegion
}: {
  country: PlacedCapital
  sameRegion: readonly PlacedCapital[]
}): [CountryCode, CountryCode, CountryCode] => {
  const [first, second, third] = sameRegion
    .filter(({ code }) => code !== country.code)
    .toSorted(
      (one, other) =>
        greatCircleKm(country.capitalPoint, one.capitalPoint) -
        greatCircleKm(country.capitalPoint, other.capitalPoint)
    )
    .map(({ code }) => code)

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`${country.code} found fewer than three decoys`)
  }

  return [first, second, third]
}

let pool: readonly FiveCluesCountry[] | null = null

/** Every country a five-clues round may hide, composed on the first draw. */
export const fiveCluesCountries = (): readonly FiveCluesCountry[] => {
  if (pool !== null) {
    return pool
  }

  const countries = withoutSizeGiveaways(composedCountries())
  const subregionCounts = countOf(countries.map(({ subregion }) => subregion))
  const regionOf = (country: ComposedCountry): M49Region =>
    m49RegionSchema.parse(
      (subregionCounts.get(country.subregion) ?? 0) >=
        FEWEST_COUNTRIES_A_REGION_HIDES
        ? country.subregion
        : country.continent
    )

  const placed = countries.map((country) => ({
    ...country,
    region: regionOf(country)
  }))

  pool = placed.map(({ continent, subregion, ...country }) => ({
    ...country,
    decoys: nearestDecoys({
      country,
      sameRegion: placed.filter(({ region }) => region === country.region)
    })
  }))

  return pool
}

/** The id a dealt country takes in the room's no-repeat set, apart from the map's and the quiz's. */
export const playedFiveCluesId = (code: CountryCode): string =>
  `fiveclues:${code}`

/**
 * A country at the room's level that the room has not climbed yet, or any at
 * that level once it has climbed them all.
 */
export const drawFiveCluesCountry = ({
  difficulty,
  playedIds
}: {
  difficulty: Difficulty
  playedIds: ReadonlySet<string>
}): { country: FiveCluesCountry; playedId: string } | null => {
  const countries = fiveCluesCountries()
  const unplayed = countries.filter(
    ({ code }) => !playedIds.has(playedFiveCluesId(code))
  )
  const country = drawByDifficulty({
    difficulty,
    pool: unplayed.length > 0 ? unplayed : countries,
    tierOf: ({ code }) => countryTierOf(code)
  })

  return country === null
    ? null
    : { country, playedId: playedFiveCluesId(country.code) }
}

/** The five clues in the order they open, the names in the room's question language. */
export const fiveCluesLadderOf = ({
  country,
  language
}: {
  country: FiveCluesCountry
  language: QuestionLanguage
}): FiveCluesLadder => [
  {
    areaSquareKilometres: country.areaSquareKilometres,
    kind: 'size',
    population: country.population
  },
  { kind: 'region', region: country.region },
  { kind: 'outline', silhouette: country.silhouette },
  { cities: country.cities.map((names) => names[language]), kind: 'cities' },
  { capital: country.capital[language], flag: country.flag, kind: 'flag' }
]

/**
 * What a typed line is graded against with `gradeQuizGuess`, as the flags
 * rubric grades: the country's name and what a table says instead, never
 * forgiving a slip as far as one of the three countries `choice` puts beside it.
 */
export const fiveCluesAnswerOf = ({
  country,
  language
}: {
  country: FiveCluesCountry
  language: QuestionLanguage
}): QuestionAnswer => {
  const names = COUNTRY_NAMES_BY_LANGUAGE[language]

  return {
    accepted: acceptedCountryNames({ code: country.code, language }),
    answer: names[country.code].name,
    decoys: country.decoys.map((code) => names[code].name)
  }
}
