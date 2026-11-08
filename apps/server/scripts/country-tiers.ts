import { createHash } from 'node:crypto'

import type { CountryCode } from '@melee/protocol/country-code'

import type { ContentTier } from '@melee/core/round/difficulty-draw'

import { frenchViewsOf } from './frwiki-notability'
import { orStop, parseJson } from './json-file'
import { cached } from './question-source'
import {
  bindingValue,
  SPARQL_URL,
  sparqlBindingsSchema,
  USER_AGENT,
  withRetries
} from './wikimedia-client'

/**
 * Easy whatever their traffic: a French table has driven to every one of
 * them, and a ranking that files Andorra beside Bhutan is plainly wrong.
 */
export const NEIGHBOURS_OF_FRANCE: ReadonlySet<CountryCode> = new Set([
  'AND',
  'BEL',
  'CHE',
  'DEU',
  'ESP',
  'ITA',
  'LUX',
  'MCO'
])

/** The G20's member states, on the evening news every week. */
const G20: ReadonlySet<CountryCode> = new Set([
  'ARG',
  'AUS',
  'BRA',
  'CAN',
  'CHN',
  'DEU',
  'FRA',
  'GBR',
  'IDN',
  'IND',
  'ITA',
  'JPN',
  'KOR',
  'MEX',
  'RUS',
  'SAU',
  'TUR',
  'USA',
  'ZAF'
])

/** The atlas calls Kosovo `XKX`; Wikidata files it under the user-assigned `XKS`. */
const ISO_OF_ATLAS_CODE: Readonly<Partial<Record<CountryCode, string>>> = {
  XKX: 'XKS'
}

/**
 * Ranked by `views`, most read first, and cut in thirds: the top third
 * `easy`, the middle `medium`, the rest `hard`. Ties break on the key, so a
 * rerun over the same traffic writes the same bank.
 */
export const tiersInThirds = <TKey extends string>(
  views: ReadonlyMap<TKey, number>
): Map<TKey, ContentTier> => {
  const ranked = [...views].toSorted(
    ([oneKey, one], [otherKey, other]) =>
      other - one || (oneKey < otherKey ? -1 : 1)
  )
  const third = Math.ceil(ranked.length / 3)

  return new Map(
    ranked.map(([key], rank) => [
      key,
      rank < third ? 'easy' : rank < 2 * third ? 'medium' : 'hard'
    ])
  )
}

/**
 * Every Wikidata entity carrying each country's ISO 3166-1 alpha-3 code.
 * Several can — Denmark proper and the Kingdom of Denmark — and only the
 * traffic says which article a French reader opens.
 */
const entitiesOf = async (
  codes: readonly CountryCode[]
): Promise<Map<CountryCode, string[]>> => {
  const codeOfIso = new Map(
    codes.map((code) => [ISO_OF_ATLAS_CODE[code] ?? code, code])
  )
  const query = `SELECT ?item ?iso WHERE {
    VALUES ?iso { ${[...codeOfIso.keys()].map((iso) => `"${iso}"`).join(' ')} }
    ?item wdt:P298 ?iso.
  }`
  const schema = sparqlBindingsSchema({ iso: bindingValue, item: bindingValue })
  const hash = createHash('sha1').update(query).digest('hex').slice(0, 16)
  const text = await cached(`country-entities-${hash}.json`, async () =>
    JSON.stringify(
      await withRetries(schema, async () =>
        fetch(SPARQL_URL, {
          body: new URLSearchParams({ query }),
          headers: {
            accept: 'application/sparql-results+json',
            'user-agent': USER_AGENT
          },
          method: 'POST'
        })
      )
    )
  )
  const entities = new Map<CountryCode, string[]>()

  for (const { iso, item } of orStop(parseJson(text, schema), hash).results
    .bindings) {
    const code = codeOfIso.get(iso.value)

    if (code !== undefined) {
      entities.set(code, [
        ...(entities.get(code) ?? []),
        item.value.split('/').at(-1) ?? item.value
      ])
    }
  }

  const missing = codes.filter((code) => !entities.has(code))

  if (missing.length > 0) {
    throw new Error(`No Wikidata entity for ${missing.join(', ')}`)
  }

  return entities
}

/**
 * How well a French table knows each country, as a tier. `easy` is decided
 * by hand — `seenByEveryTable`, France's neighbours and the G20 — because
 * sixty days of traffic follow the news: a coup put Burkina Faso above
 * Thailand. The rest is ranked by the traffic of its French Wikipedia article
 * and cut in halves, `medium` then `hard`, which is all that signal is fit
 * to separate. A territory is never `easy`.
 */
export const countryTiers = async ({
  codes,
  seenByEveryTable,
  sovereign
}: {
  codes: readonly CountryCode[]
  seenByEveryTable: ReadonlySet<CountryCode>
  sovereign: ReadonlySet<CountryCode>
}): Promise<Map<CountryCode, ContentTier>> => {
  const entities = await entitiesOf(codes)
  const views = await frenchViewsOf({
    entityIds: [...entities.values()].flat(),
    label: 'countries'
  })
  const isEasy = (code: CountryCode) =>
    sovereign.has(code) &&
    (seenByEveryTable.has(code) ||
      NEIGHBOURS_OF_FRANCE.has(code) ||
      G20.has(code))
  const ranked = [...codes]
    .filter((code) => !isEasy(code))
    .map((code) => ({
      code,
      views: Math.max(
        ...(entities.get(code) ?? []).map((id) => views.get(id) ?? 0)
      )
    }))
    .toSorted(
      (one, other) =>
        other.views - one.views || (one.code < other.code ? -1 : 1)
    )
  const half = Math.ceil(ranked.length / 2)

  return new Map([
    ...codes.filter(isEasy).map((code) => [code, 'easy'] as const),
    ...ranked.map(
      ({ code }, rank) => [code, rank < half ? 'medium' : 'hard'] as const
    )
  ])
}

const DECOY_COUNT = 3

/**
 * Three decoys for a table playing `easy`: easy countries, each from a
 * continent the answer is not on and none sharing one, so Japan's flag stands
 * beside Brazil's, Germany's and Nigeria's rather than Bangladesh's. The order
 * is a hash of the pair, fixed from one build to the next and different for
 * every answer.
 */
export const easyDecoysOf = ({
  code,
  regionOf,
  tiers
}: {
  code: CountryCode
  regionOf: (code: CountryCode) => string | undefined
  tiers: ReadonlyMap<CountryCode, ContentTier>
}): [CountryCode, CountryCode, CountryCode] => {
  const region = regionOf(code)
  const shuffledByPair = [...tiers]
    .filter(
      ([other, tier]) =>
        tier === 'easy' &&
        other !== code &&
        regionOf(other) !== undefined &&
        regionOf(other) !== region
    )
    .map(([other]) => other)
    .toSorted((one, other) => {
      const hashOf = (candidate: CountryCode) =>
        createHash('sha1').update(`${code}:${candidate}`).digest('hex')

      return hashOf(one) < hashOf(other) ? -1 : 1
    })
  const regionsTaken = new Set<string | undefined>()
  const decoys: CountryCode[] = []

  for (const candidate of shuffledByPair) {
    if (decoys.length < DECOY_COUNT && !regionsTaken.has(regionOf(candidate))) {
      regionsTaken.add(regionOf(candidate))
      decoys.push(candidate)
    }
  }

  const [first, second, third] = decoys

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`${code} found fewer than three easy decoys`)
  }

  return [first, second, third]
}
