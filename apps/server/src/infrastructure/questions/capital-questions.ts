import type { CountryCode } from '@melee/protocol/country-code'
import type { LocalizedText } from '@melee/protocol/locale'
import {
  type QuestionLanguage,
  questionLanguages
} from '@melee/protocol/question'

import { greatCircleKm } from '@melee/core/atlas/distance'
import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { COUNTRY_NAMES_PT } from '@melee/core/countries/country-names-pt'
import { normalizeAnswer } from '@melee/core/round/answer-matching'

import { bankedCapitals, type CapitalRow } from './capital-bank'
import type { BankedQuestion, WrittenRow } from './question-bank'

/** A state that is one city: asking for its capital names the answer. */
const CITY_STATES: ReadonlySet<CountryCode> = new Set(['MCO', 'SGP', 'VAT'])

/**
 * Below this many Wikipedia editions a city is a name a table has not heard,
 * and a decoy nobody has heard of is a decoy nobody picks. The bank's median
 * city stands at seventy.
 */
const HEARD_OF_SITELINKS = 50

const DECOY_COUNT = 3

/** The French *de* before a country, contracted with its article. */
const ofCountryFr = (withArticle: string): string => {
  if (withArticle.startsWith('le ')) {
    return `du ${withArticle.slice('le '.length)}`
  }

  if (withArticle.startsWith('les ')) {
    return `des ${withArticle.slice('les '.length)}`
  }

  if (/^(la |l’)/.test(withArticle)) {
    return `de ${withArticle}`
  }

  return /^[aeiouyh]/i.test(withArticle.normalize('NFD'))
    ? `d’${withArticle}`
    : `de ${withArticle}`
}

const PORTUGUESE_DE_WITH_ARTICLE = {
  a: 'da',
  as: 'das',
  o: 'do',
  os: 'dos'
} as const

/** The Portuguese *de* before a country, contracted with its article. */
const ofCountryPt = (withArticle: string): string => {
  for (const [article, contracted] of Object.entries(
    PORTUGUESE_DE_WITH_ARTICLE
  )) {
    if (withArticle.startsWith(`${article} `)) {
      return `${contracted} ${withArticle.slice(article.length + 1)}`
    }
  }

  return `de ${withArticle}`
}

const capitalPrompt = (code: CountryCode): LocalizedText => ({
  en: `What is the capital of ${COUNTRY_NAMES_EN[code].withArticle}?`,
  fr: `Quelle est la capitale ${ofCountryFr(COUNTRY_NAMES_FR[code].withArticle)} ?`,
  pt: `Qual é a capital ${ofCountryPt(COUNTRY_NAMES_PT[code].withArticle)}?`
})

/** A city a capital question may offer: its Wikidata id and its name in every language. */
type OfferedCity = Pick<CapitalRow['capital'], 'id' | 'names'>

/**
 * Three cities picked by identity, never by name, so choice i is the same city
 * in every language. A city is skipped when it is one already taken, or when
 * any of its names is a name already offered in that language — two places
 * read the same on a screen would be one choice twice.
 */
const threeCities = ({
  candidates,
  taken
}: {
  candidates: Iterable<OfferedCity>
  taken: readonly OfferedCity[]
}): [OfferedCity, OfferedCity, OfferedCity] | null => {
  const offered = [...taken]
  const picked: OfferedCity[] = []
  const readsLikeOneOffered = (city: OfferedCity): boolean =>
    offered.some(
      (other) =>
        other.id === city.id ||
        questionLanguages.some(
          (language) => other.names[language] === city.names[language]
        )
    )

  for (const city of candidates) {
    if (picked.length === DECOY_COUNT) {
      break
    }

    if (!readsLikeOneOffered(city)) {
      offered.push(city)
      picked.push(city)
    }
  }

  const [first, second, third] = picked

  return first === undefined || second === undefined || third === undefined
    ? null
    : [first, second, third]
}

const namesOf = (
  cities: readonly [OfferedCity, OfferedCity, OfferedCity]
): [LocalizedText, LocalizedText, LocalizedText] => [
  cities[0].names,
  cities[1].names,
  cities[2].names
]

/**
 * The country's own cities first — Sydney and Melbourne for Canberra, the
 * mistake the question is there to catch — then the capitals of the nearest
 * states, the flags' fill rule. A seat is never one: it is a right answer.
 */
const decoysFor = ({
  row,
  rows
}: {
  row: CapitalRow
  rows: readonly CapitalRow[]
}): [LocalizedText, LocalizedText, LocalizedText] => {
  const neighbours = rows
    .filter((other) => other.code !== row.code)
    .toSorted(
      (a, b) =>
        greatCircleKm(row.capital.point, a.capital.point) -
        greatCircleKm(row.capital.point, b.capital.point)
    )
  const cities = threeCities({
    candidates: [
      ...row.largestCities.filter(
        ({ sitelinks }) => sitelinks >= HEARD_OF_SITELINKS
      ),
      ...neighbours.map(({ capital }) => capital)
    ],
    taken: [row.capital, ...row.seats]
  })

  if (cities === null) {
    throw new Error(`No three decoys for the capital of ${row.code}`)
  }

  return namesOf(cities)
}

/** A fixed 32-bit FNV-1a of `text`: the same order on every cold start, a different one for every answer. */
const fnv1a = (text: string): number => {
  let hash = 0x811c9dc5

  for (const character of text) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 0x01000193) >>> 0
  }

  return hash
}

/**
 * What an `easy` room is shown instead: easy capitals from three continents
 * the answer is not on, so Canberra stands beside Berlin, Tokyo and Lima
 * rather than beside Sydney and Melbourne.
 */
const easyDecoysFor = ({
  row,
  rows
}: {
  row: CapitalRow
  rows: readonly CapitalRow[]
}): [LocalizedText, LocalizedText, LocalizedText] => {
  const regionsTaken = new Set([row.region])
  const fromOtherContinents: OfferedCity[] = []

  for (const other of rows
    .filter(({ capital }) => capital.tier === 'easy')
    .toSorted(
      (one, other) =>
        fnv1a(`${row.code}:${one.code}`) - fnv1a(`${row.code}:${other.code}`)
    )) {
    if (!regionsTaken.has(other.region)) {
      regionsTaken.add(other.region)
      fromOtherContinents.push(other.capital)
    }
  }

  const cities = threeCities({
    candidates: fromOtherContinents,
    taken: [row.capital, ...row.seats]
  })

  if (cities === null) {
    throw new Error(`No three easy decoys for the capital of ${row.code}`)
  }

  return namesOf(cities)
}

const askedRows = (): CapitalRow[] =>
  bankedCapitals().filter((row) => !CITY_STATES.has(row.code))

/** The capital's other names, and every seat: Sucre is asked, La Paz is right. */
const acceptedFor = ({
  language,
  row
}: {
  language: QuestionLanguage
  row: CapitalRow
}): string[] => [
  ...row.capital.aliases[language],
  ...row.seats.flatMap((seat) => [
    seat.names[language],
    ...seat.aliases[language]
  ])
]

/** What a table may type in any language beside the capital's name in its own. */
const acceptedInEveryLanguage = (row: CapitalRow): string[] => [
  ...new Set(
    questionLanguages.flatMap((language) => acceptedFor({ language, row }))
  )
]

let capitalQuestions: BankedQuestion[] | undefined

/**
 * Every capital, each one question read in every language, built on the first
 * draw like the bank. The prompt keeps each language's own contraction of the
 * country — *du Japon*, *do Japão*.
 */
export const bankedCapitalQuestions = (): BankedQuestion[] => {
  capitalQuestions ??= askedRows().map((row) => ({
    accepted: acceptedInEveryLanguage(row),
    answer: row.capital.names,
    category: 'capitals' as const,
    choiceOnly: false,
    decoys: decoysFor({ row, rows: bankedCapitals() }),
    easyDecoys: easyDecoysFor({ row, rows: askedRows() }),
    flag: null,
    id: `capital-${row.code}`,
    isAdult: false,
    isWellKnown: row.capital.tier === 'easy',
    language: null,
    note: null,
    prompt: capitalPrompt(row.code),
    rebus: null,
    silhouette: null,
    theme: 'wikidata-capitals',
    tier: row.capital.tier
  }))

  return capitalQuestions
}

const COUNTRY_NAMES_BY_LANGUAGE = {
  en: COUNTRY_NAMES_EN,
  fr: COUNTRY_NAMES_FR,
  pt: COUNTRY_NAMES_PT
} as const satisfies Record<
  QuestionLanguage,
  Record<CountryCode, { name: string }>
>

let askedCapitals: Map<string, string[]> | undefined

/** Each spelling of a capital the rubric asks, keyed by language, to the countries it answers for. */
const capitalsAsked = (): Map<string, string[]> => {
  if (askedCapitals !== undefined) {
    return askedCapitals
  }

  const asked = new Map<string, string[]>()

  for (const row of askedRows()) {
    for (const language of questionLanguages) {
      const country = normalizeAnswer(
        COUNTRY_NAMES_BY_LANGUAGE[language][row.code].name
      )

      for (const spelling of [
        row.capital.names[language],
        ...acceptedFor({ language, row })
      ]) {
        const key = `${language}::${normalizeAnswer(spelling)}`

        asked.set(key, [...(asked.get(key) ?? []), country])
      }
    }
  }

  askedCapitals = asked

  return asked
}

/**
 * Whether another subject's row asks what the rubric already does — *What is
 * the capital city of New Zealand?* under geography — so a room ticking both
 * is never asked it twice under two ids.
 */
export const asksACapitalTheRubricAsks = (
  question: Pick<WrittenRow, 'accepted' | 'answer' | 'language' | 'prompt'>
): boolean => {
  if (!/capital/i.test(question.prompt)) {
    return false
  }

  const prompt = normalizeAnswer(question.prompt)

  return [question.answer, ...question.accepted].some((spelling) =>
    (
      capitalsAsked().get(
        `${question.language}::${normalizeAnswer(spelling)}`
      ) ?? []
    ).some((country) => prompt.includes(country))
  )
}
