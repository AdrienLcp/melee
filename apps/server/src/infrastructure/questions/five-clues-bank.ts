import type { GeoPoint } from '@melee/protocol/atlas'
import type { CountryCode } from '@melee/protocol/country-code'
import type { Difficulty } from '@melee/protocol/difficulty'
import {
  type FiveCluesLadder,
  type FiveCluesSubject,
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
import {
  type SilhouetteOutline,
  silhouetteFileOf,
  silhouetteOutlineOf
} from './silhouette-questions'

/**
 * The three countries `choice` puts beside the answer, one struck off by each
 * of the first three clues as it opens: the size clue rules out one of the
 * same region `SIZE_APART` times bigger or smaller, the region clue one of a
 * like size from elsewhere, the outline clue one of the same region and a
 * like size whose silhouette is drawn clearly otherwise.
 */
export type StaircaseDecoys = {
  outline: CountryCode
  region: CountryCode
  size: CountryCode
}

/** A country with the numbers a decoy is chosen on. */
export type MeasuredCountry = {
  areaSquareKilometres: number
  capital: Readonly<Record<Locale, string>>
  capitalPoint: GeoPoint
  /** Up to three, never one whose name carries the country's in any language. */
  cities: readonly Readonly<Record<Locale, string>>[]
  code: CountryCode
  flag: FlagFile
  /** Its M49 continent and the group beneath it: a region clue naming either leaves it standing. */
  groups: readonly [string, string]
  outline: SilhouetteOutline
  population: number
  silhouette: SilhouetteFile
}

/** One country with every rung of its ladder, composed from the banks the other games deal. */
export type FiveCluesCountry = MeasuredCountry & {
  decoys: StaircaseDecoys
  region: M49Region
}

/**
 * What one round hides, whatever its subject: the ladder in climbing order,
 * what a typed line is graded against — `decoys` being the three names
 * `choice` shows — and the id the room's no-repeat set keeps.
 */
export type FiveCluesCard = {
  answer: QuestionAnswer
  ladder: FiveCluesLadder
  playedId: string
  subject: FiveCluesSubject
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

/** Bigger or smaller by this much, in its people or its land, and the size clue rules a country out. */
export const SIZE_APART = 3

/** Within this much on both numbers, a decoy is one the size clue plainly leaves standing. */
const SIZE_ALIKE = 2

/** Silhouettes this much more stretched, or this much more compact, are told apart at a glance. */
export const OUTLINE_STRETCH_APART = 1.6
export const OUTLINE_COMPACTNESS_APART = 2

type Sized = Pick<MeasuredCountry, 'areaSquareKilometres' | 'population'>

const ratioOf = (one: number, other: number): number =>
  Math.max(one, other) / Math.min(one, other)

/** The larger of the two ratios between their people and their land, 1 for twins. */
export const sizeRatioOf = (one: Sized, other: Sized): number =>
  Math.max(
    ratioOf(one.population, other.population),
    ratioOf(one.areaSquareKilometres, other.areaSquareKilometres)
  )

/** Whether a region clue naming `region` leaves `country` standing. */
export const regionHolds = ({
  country,
  region
}: {
  country: Pick<MeasuredCountry, 'groups'>
  region: M49Region
}): boolean => country.groups.includes(region)

/** Whether a table looking at both silhouettes tells them apart at once. */
export const outlinesDiffer = (
  one: SilhouetteOutline,
  other: SilhouetteOutline
): boolean =>
  ratioOf(one.elongation, other.elongation) >= OUTLINE_STRETCH_APART ||
  ratioOf(one.compactness, other.compactness) >= OUTLINE_COMPACTNESS_APART

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

let measured: readonly MeasuredCountry[] | null = null

/**
 * Every country with every rung's data, the size giveaways included: those
 * are never dealt, but a decoy may be one, since being one costs nothing.
 */
export const measuredCountries = (): readonly MeasuredCountry[] => {
  if (measured !== null) {
    return measured
  }

  const capitals = new Map(bankedCapitals().map((row) => [row.code, row]))
  const populations = countryValuesOf('population.country')
  const areas = countryValuesOf('area.country')

  measured = BANKED_COUNTRIES.flatMap((code) => {
    const capitalRow = capitals.get(code)
    const population = populations.get(code)
    const areaSquareKilometres = areas.get(code)
    const flag = flagFileOf(code)
    const silhouette = silhouetteFileOf(code)
    const outline = silhouetteOutlineOf(code)
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
      outline === null ||
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
        flag,
        groups: [capitalRow.region, capitalRow.subregion] as const,
        outline,
        population,
        silhouette
      }
    ]
  })

  return measured
}

const largestBy = ({
  countries,
  measure
}: {
  countries: readonly MeasuredCountry[]
  measure: (country: MeasuredCountry) => number
}): CountryCode[] =>
  countries
    .toSorted((one, other) => measure(other) - measure(one))
    .slice(0, SIZE_RANKS_THAT_GIVE_IT_AWAY)
    .map(({ code }) => code)

const withoutSizeGiveaways = (
  countries: readonly MeasuredCountry[]
): MeasuredCountry[] => {
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

/**
 * The nearest capital among the countries that fit, those plainly alike in
 * size first: a decoy is a country a table hesitates over until its clue opens.
 */
const nearestFitting = ({
  candidates,
  country,
  fits,
  taken
}: {
  candidates: readonly MeasuredCountry[]
  country: MeasuredCountry
  fits: (candidate: MeasuredCountry) => boolean
  taken: ReadonlySet<CountryCode>
}): CountryCode | null => {
  const [alike, nearest] = [
    (candidate: MeasuredCountry) =>
      sizeRatioOf(country, candidate) <= SIZE_ALIKE,
    () => true
  ].map(
    (prefers) =>
      candidates
        .filter(
          (candidate) =>
            candidate.code !== country.code &&
            !taken.has(candidate.code) &&
            fits(candidate) &&
            prefers(candidate)
        )
        .toSorted(
          (one, other) =>
            greatCircleKm(country.capitalPoint, one.capitalPoint) -
            greatCircleKm(country.capitalPoint, other.capitalPoint)
        )[0]
  )

  return (alike ?? nearest)?.code ?? null
}

/** The country from elsewhere nearest in size, where none elsewhere is a like size: Luxembourg's is still a small one. */
const mostAlikeOutside = ({
  candidates,
  country
}: {
  candidates: readonly MeasuredCountry[]
  country: MeasuredCountry & { region: M49Region }
}): CountryCode | null =>
  candidates
    .filter(
      (candidate) =>
        !regionHolds({ country: candidate, region: country.region })
    )
    .toSorted(
      (one, other) => sizeRatioOf(country, one) - sizeRatioOf(country, other)
    )[0]?.code ?? null

/**
 * Choice's three decoys, a staircase down the first three clues. Where the
 * region is too thin to hold one of them, the nearest capital of the region
 * stands in and that clue strikes nothing new — `five-clues-bank.test.ts`
 * names every country it happens to.
 */
const staircaseOf = ({
  candidates,
  country
}: {
  candidates: readonly MeasuredCountry[]
  country: MeasuredCountry & { region: M49Region }
}): StaircaseDecoys => {
  const taken = new Set<CountryCode>()
  const pick = (fits: (candidate: MeasuredCountry) => boolean) => {
    const code = nearestFitting({ candidates, country, fits, taken })

    if (code !== null) {
      taken.add(code)
    }

    return code
  }
  const inRegion = (candidate: MeasuredCountry) =>
    regionHolds({ country: candidate, region: country.region })
  const survivesSize = (candidate: MeasuredCountry) =>
    sizeRatioOf(country, candidate) < SIZE_APART

  const size = pick(
    (candidate) => inRegion(candidate) && !survivesSize(candidate)
  )
  const region = pick(
    (candidate) => !inRegion(candidate) && survivesSize(candidate)
  )
  const outline = pick(
    (candidate) =>
      inRegion(candidate) &&
      survivesSize(candidate) &&
      outlinesDiffer(country.outline, candidate.outline)
  )
  const decoys = {
    outline: outline ?? pick(inRegion),
    region: region ?? mostAlikeOutside({ candidates, country }),
    size: size ?? pick(inRegion)
  }

  if (
    decoys.outline === null ||
    decoys.region === null ||
    decoys.size === null
  ) {
    throw new Error(`${country.code} found fewer than three decoys`)
  }

  return {
    outline: decoys.outline,
    region: decoys.region,
    size: decoys.size
  }
}

let pool: readonly FiveCluesCountry[] | null = null

/** Every country a five-clues round may hide, composed on the first draw. */
export const fiveCluesCountries = (): readonly FiveCluesCountry[] => {
  if (pool !== null) {
    return pool
  }

  const candidates = measuredCountries()
  const countries = withoutSizeGiveaways(candidates)
  const subregionCounts = countOf(
    countries.map(({ groups: [, subregion] }) => subregion)
  )
  const regionOf = ({
    groups: [continent, subregion]
  }: MeasuredCountry): M49Region =>
    m49RegionSchema.parse(
      (subregionCounts.get(subregion) ?? 0) >= FEWEST_COUNTRIES_A_REGION_HIDES
        ? subregion
        : continent
    )

  pool = countries.map((country) => {
    const placed = { ...country, region: regionOf(country) }

    return { ...placed, decoys: staircaseOf({ candidates, country: placed }) }
  })

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
}): FiveCluesCountry | null => {
  const countries = fiveCluesCountries()
  const unplayed = countries.filter(
    ({ code }) => !playedIds.has(playedFiveCluesId(code))
  )

  return drawByDifficulty({
    difficulty,
    pool: unplayed.length > 0 ? unplayed : countries,
    tierOf: ({ code }) => countryTierOf(code)
  })
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
  const { outline, region, size } = country.decoys

  return {
    accepted: acceptedCountryNames({ code: country.code, language }),
    answer: names[country.code].name,
    decoys: [size, region, outline].map((code) => names[code].name)
  }
}

/**
 * The next round's card at the room's level, in its question language: a
 * country the room has not climbed yet, or `null` with none at that level.
 */
export const drawFiveCluesCard = ({
  difficulty,
  language,
  playedIds
}: {
  difficulty: Difficulty
  language: QuestionLanguage
  playedIds: ReadonlySet<string>
}): FiveCluesCard | null => {
  const country = drawFiveCluesCountry({ difficulty, playedIds })

  return country === null
    ? null
    : {
        answer: fiveCluesAnswerOf({ country, language }),
        ladder: fiveCluesLadderOf({ country, language }),
        playedId: playedFiveCluesId(country.code),
        subject: 'country'
      }
}
