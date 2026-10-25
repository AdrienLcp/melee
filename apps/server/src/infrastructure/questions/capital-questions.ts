import type { CountryCode } from '@melee/protocol/country-code'
import {
  type QuestionLanguage,
  questionLanguages
} from '@melee/protocol/question'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { normalizeAnswer } from '@melee/core/round/answer-matching'
import { greatCircleKm } from '@melee/core/worldmap/distance'

import { bankedCapitals, type CapitalRow } from './capital-bank'
import type { BankedQuestion } from './question-bank'

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

const PROMPT_BY_LANGUAGE = {
  en: (code: CountryCode) =>
    `What is the capital of ${COUNTRY_NAMES_EN[code].withArticle}?`,
  fr: (code: CountryCode) =>
    `Quelle est la capitale ${ofCountryFr(COUNTRY_NAMES_FR[code].withArticle)} ?`
} as const satisfies Record<QuestionLanguage, (code: CountryCode) => string>

/**
 * The country's own cities first — Sydney and Melbourne for Canberra, the
 * mistake the question is there to catch — then the capitals of the nearest
 * states, the flags' fill rule. A seat is never one: it is a right answer.
 */
const decoysFor = ({
  language,
  row,
  rows
}: {
  language: QuestionLanguage
  row: CapitalRow
  rows: readonly CapitalRow[]
}): [string, string, string] => {
  const taken = new Set([
    row.capital.names[language],
    ...row.seats.map((seat) => seat.names[language])
  ])
  const decoys: string[] = []

  const offer = (name: string) => {
    if (decoys.length < DECOY_COUNT && !taken.has(name)) {
      taken.add(name)
      decoys.push(name)
    }
  }

  for (const city of row.largestCities) {
    if (city.sitelinks >= HEARD_OF_SITELINKS) {
      offer(city.names[language])
    }
  }

  const neighbours = rows
    .filter((other) => other.code !== row.code)
    .toSorted(
      (a, b) =>
        greatCircleKm(row.capital.point, a.capital.point) -
        greatCircleKm(row.capital.point, b.capital.point)
    )

  for (const neighbour of neighbours) {
    offer(neighbour.capital.names[language])
  }

  const [first, second, third] = decoys

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`No three decoys for the capital of ${row.code}`)
  }

  return [first, second, third]
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

let capitalQuestions: BankedQuestion[] | undefined

/** Every capital in both languages, built on the first draw like the bank. */
export const bankedCapitalQuestions = (): BankedQuestion[] => {
  capitalQuestions ??= askedRows().flatMap((row) =>
    questionLanguages.map((language) => ({
      accepted: acceptedFor({ language, row }),
      answer: row.capital.names[language],
      category: 'capitals' as const,
      choiceOnly: false,
      decoys: decoysFor({ language, row, rows: bankedCapitals() }),
      flag: null,
      id: `capital-${language}-${row.code}`,
      isAdult: false,
      isWellKnown: row.capital.isWellKnown,
      language,
      note: null,
      prompt: PROMPT_BY_LANGUAGE[language](row.code),
      rebus: null,
      theme: 'wikidata-capitals'
    }))
  )

  return capitalQuestions
}

const COUNTRY_NAMES_BY_LANGUAGE = {
  en: COUNTRY_NAMES_EN,
  fr: COUNTRY_NAMES_FR
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
  question: BankedQuestion
): boolean => {
  if (!/capital/i.test(question.prompt)) {
    return false
  }

  const countries =
    capitalsAsked().get(
      `${question.language}::${normalizeAnswer(question.answer)}`
    ) ?? []
  const prompt = normalizeAnswer(question.prompt)

  return countries.some((country) => prompt.includes(country))
}
