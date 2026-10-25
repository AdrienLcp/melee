import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import {
  type CountryCode,
  countryCodeSchema
} from '@melee/protocol/country-code'

import type { CapitalRow } from '../src/infrastructure/questions/capital-bank'
import { frenchViewsOf, isWellKnownInFrench } from './frwiki-notability'
import { orStop, parseJson } from './json-file'
import {
  cached,
  chunked,
  readCachedEntries,
  writeCachedEntries
} from './question-source'
import { aliasesOf } from './wikidata-aliases'
import {
  bindingValue,
  SPARQL_URL,
  sparqlBindingsSchema,
  USER_AGENT,
  withRetries
} from './wikimedia-client'

const HERE = dirname(fileURLToPath(import.meta.url))
const BANK_PATH = join(
  HERE,
  '../src/infrastructure/questions/capital-bank.json'
)

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
const M49_URL = 'https://unstats.un.org/unsd/methodology/m49/overview/'

/** A party game does not referee Jerusalem. */
const LEFT_OUT: ReadonlySet<CountryCode> = new Set(['ISR', 'PSE'])

/**
 * Wikidata files Denmark (Q35) as a country but not as a sovereign state: the
 * state is the Kingdom, which carries no ISO code of its own.
 */
const STATES_ADDED: Readonly<Partial<Record<CountryCode, string>>> = {
  DNK: 'Q35'
}

/**
 * The sovereign state is the Kingdom of the Netherlands, and Rotterdam's
 * country is the Netherlands (Q55): asked of the Kingdom, the query finds
 * no city at all.
 */
const CITY_COUNTRY_OF: Readonly<Partial<Record<CountryCode, string>>> = {
  NLD: 'Q55'
}

/** Wikidata gives Kosovo the user-assigned `XKS`, the atlas `XKX`. */
const ATLAS_CODE_OF_ISO: Readonly<Record<string, string>> = { XKS: 'XKX' }

type Override = {
  capital: { en: string; id: string }
  seats: readonly { en: string; id: string }[]
}

/**
 * Where Wikidata holds several current capitals, the one a table is asked for
 * and the others it may give and be right. Each English label is checked
 * against Wikidata, so a mistyped id stops the build rather than banking the
 * wrong city. Any other state with more than one capital stops it too.
 */
const CAPITAL_OVERRIDES: Readonly<Partial<Record<CountryCode, Override>>> = {
  BEN: {
    capital: { en: 'Porto-Novo', id: 'Q3799' },
    seats: [{ en: 'Cotonou', id: 'Q43595' }]
  },
  BOL: {
    capital: { en: 'Sucre', id: 'Q2907' },
    seats: [{ en: 'La Paz', id: 'Q1491' }]
  },
  IDN: { capital: { en: 'Jakarta', id: 'Q3630' }, seats: [] },
  LKA: {
    capital: { en: 'Sri Jayawardenepura Kotte', id: 'Q41963' },
    seats: [{ en: 'Colombo', id: 'Q35381' }]
  },
  MYS: {
    capital: { en: 'Kuala Lumpur', id: 'Q1865' },
    seats: [{ en: 'Putrajaya', id: 'Q182378' }]
  },
  // The Hague holds the government, but the constitution names Amsterdam alone.
  NLD: { capital: { en: 'Amsterdam', id: 'Q727' }, seats: [] },
  SWZ: {
    capital: { en: 'Mbabane', id: 'Q3904' },
    seats: [{ en: 'Lobamba', id: 'Q101418' }]
  },
  YEM: {
    capital: { en: 'Sanaa', id: 'Q2471' },
    seats: [{ en: 'Aden', id: 'Q131694' }]
  },
  ZAF: {
    capital: { en: 'Pretoria', id: 'Q3926' },
    seats: [
      { en: 'Cape Town', id: 'Q5465' },
      { en: 'Bloemfontein', id: 'Q37701' }
    ]
  }
}

/** Two places M49 does not list, filed where the UN's neighbours put them. */
const M49_ADDED: Readonly<Partial<Record<CountryCode, M49Group>>> = {
  TWN: { region: '142', subregion: '030' },
  XKX: { region: '150', subregion: '039' }
}

const CITIES_PER_COUNTRY = 5

/**
 * The most populous places a country query reads, which the five best known
 * are then picked from. Population alone ranks badly: Veracruz carries its
 * state's eight million and would open Mexico's list ahead of Guadalajara.
 */
const CITIES_ASKED = 25

/** Below this a city is a name only its own region has heard. */
const CITY_SITELINKS_FLOOR = 20

const CITY = 'Q515'

/**
 * Seville, Valencia, Sfax and León are filed as municipalities and never as
 * cities. Asked in one query with the cities, Russia outruns Wikidata's
 * sixty-second limit, so each class is its own query.
 */
const MUNICIPALITY = 'Q15284'

/**
 * What answers *city* on Wikidata and is not one, unless it is also filed as a
 * city outright — Lagos and Melbourne carry *metropolitan area* beside *city*:
 * an urban area counted around a city (Greater Buenos Aires, the New York
 * metropolitan area, the Metropolis of Lyon), a Swiss canton holding one
 * (Basel-Stadt), a Turkish or Vietnamese province, a South African metropolitan
 * municipality or a Norwegian one.
 */
const NOT_A_CITY: ReadonlySet<string> = new Set([
  'Q1907114',
  'Q23058',
  'Q3333855',
  'Q159313',
  'Q1768043',
  'Q48336',
  'Q2824648',
  'Q1530824',
  'Q755707'
])

/**
 * Filed as a city by mistake: Puntland, a hospital in Byumba, the province of
 * Quảng Ninh, a Dominican locality labelled "Luperon pto pta" and the
 * municipality around Al Rayyan.
 */
const NOT_A_CITY_IDS: ReadonlySet<string> = new Set([
  'Q2621587',
  'Q391747',
  'Q33396',
  'Q988413',
  'Q311272'
])

type M49Group = { region: string; subregion: string }

const sparql = async <TBinding extends z.ZodRawShape>({
  binding,
  query
}: {
  binding: TBinding
  query: string
}) => {
  const schema = sparqlBindingsSchema(binding)
  const hash = createHash('sha1').update(query).digest('hex').slice(0, 16)
  const text = await cached(`capitals-${hash}.json`, async () =>
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

  return orStop(parseJson(text, schema), hash).results.bindings
}

const entityIdOf = (uri: string): string => uri.split('/').at(-1) ?? uri

const isCountryCode = (code: string): code is CountryCode =>
  countryCodeSchema.safeParse(code).success

const sovereignStates = async (): Promise<Map<CountryCode, string>> => {
  const rows = await sparql({
    binding: { iso: bindingValue, state: bindingValue },
    query: `SELECT ?state ?iso WHERE {
      ?state wdt:P31 wd:Q3624078; wdt:P298 ?iso.
      FILTER NOT EXISTS { ?state wdt:P576 ?dissolved }
    }`
  })
  const states = new Map<CountryCode, string>()

  for (const { iso, state } of rows) {
    const code = ATLAS_CODE_OF_ISO[iso.value] ?? iso.value

    if (isCountryCode(code) && !LEFT_OUT.has(code)) {
      states.set(code, entityIdOf(state.value))
    }
  }

  for (const [code, state] of Object.entries(STATES_ADDED)) {
    if (isCountryCode(code) && state !== undefined) {
      states.set(code, state)
    }
  }

  return states
}

const currentCapitals = async (
  states: ReadonlyMap<CountryCode, string>
): Promise<Map<string, string[]>> => {
  const rows = await sparql({
    binding: { capital: bindingValue, state: bindingValue },
    query: `SELECT DISTINCT ?state ?capital WHERE {
      VALUES ?state { ${[...states.values()].map((id) => `wd:${id}`).join(' ')} }
      ?state p:P36 ?statement.
      ?statement ps:P36 ?capital.
      FILTER NOT EXISTS { ?statement pq:P582 ?ended }
    }`
  })
  const capitals = new Map<string, string[]>()

  for (const { capital, state } of rows) {
    const id = entityIdOf(state.value)

    capitals.set(id, [...(capitals.get(id) ?? []), entityIdOf(capital.value)])
  }

  return capitals
}

const POINT_PATTERN = /^Point\((-?[\d.]+) (-?[\d.]+)\)$/

const pointsOf = async (
  entityIds: readonly string[]
): Promise<Map<string, CapitalRow['capital']['point']>> => {
  const rows = await sparql({
    binding: { coordinates: bindingValue, place: bindingValue },
    query: `SELECT ?place (SAMPLE(?point) AS ?coordinates) WHERE {
      VALUES ?place { ${entityIds.map((id) => `wd:${id}`).join(' ')} }
      ?place p:P625 ?statement.
      ?statement ps:P625 ?point; wikibase:rank ?rank.
      FILTER(?rank != wikibase:DeprecatedRank)
    } GROUP BY ?place`
  })

  return new Map(
    rows.flatMap(({ coordinates, place }) => {
      const match = POINT_PATTERN.exec(coordinates.value)

      return match === null
        ? []
        : [
            [
              entityIdOf(place.value),
              { latitude: Number(match[2]), longitude: Number(match[1]) }
            ] as const
          ]
    })
  )
}

const labelsSchema = z.object({
  entities: z.record(
    z.string(),
    z.object({
      labels: z.record(z.string(), z.object({ value: z.string() })).optional()
    })
  )
})

type Names = { en: string; fr: string }

/**
 * Both names of each place, read from the action API: the query service is
 * silent on some labels (Oslo in French, St. John's in English) that the
 * database holds, and the language-neutral `mul` label stands in where a
 * language has none.
 */
const namesOf = async (
  entityIds: readonly string[]
): Promise<Map<string, Names>> => {
  const cache = 'capital-labels.json'
  const known = await readCachedEntries(
    cache,
    z.object({ en: z.string(), fr: z.string() }).nullable()
  )
  const missing = [...new Set(entityIds)].filter((id) => !(id in known))

  for (const batch of chunked({ items: missing, size: 50 })) {
    const parameters = new URLSearchParams({
      action: 'wbgetentities',
      format: 'json',
      formatversion: '2',
      ids: batch.join('|'),
      languages: 'en|fr|mul',
      props: 'labels'
    })
    const body = await withRetries(labelsSchema, async () =>
      fetch(`${WIKIDATA_API}?${parameters}`, {
        headers: { 'user-agent': USER_AGENT }
      })
    )

    for (const id of batch) {
      const labels = body.entities[id]?.labels ?? {}
      const fallback = labels.mul?.value
      const en = labels.en?.value ?? fallback
      const fr = labels.fr?.value ?? fallback

      known[id] = en === undefined || fr === undefined ? null : { en, fr }
    }
  }

  await writeCachedEntries({ entries: known, name: cache })

  return new Map(
    entityIds.flatMap((id) => {
      const names = known[id]

      return names == null ? [] : [[id, names] as const]
    })
  )
}

type CityCandidate = { id: string; sitelinks: number }

const mostPopulousFiledAs = ({
  country,
  placeClass
}: {
  country: string
  placeClass: string
}) =>
  sparql({
    binding: {
      city: bindingValue,
      kinds: bindingValue,
      links: bindingValue
    },
    query: `SELECT ?city ?links (MAX(?population) AS ?people) (GROUP_CONCAT(DISTINCT ?kind) AS ?kinds) WHERE {
      ?city wdt:P17 wd:${country}; wdt:P1082 ?population; wdt:P31/wdt:P279* wd:${placeClass};
        wikibase:sitelinks ?links; wdt:P31 ?kind.
      FILTER NOT EXISTS { ?city wdt:P576 ?dissolved }
    } GROUP BY ?city ?links ORDER BY DESC(?people) LIMIT ${CITIES_ASKED}`
  })

const largestCitiesOf = async (country: string): Promise<CityCandidate[]> => {
  const rows = [
    ...(await mostPopulousFiledAs({ country, placeClass: CITY })),
    ...(await mostPopulousFiledAs({ country, placeClass: MUNICIPALITY }))
  ]
  const rowsById = new Map(rows.map((row) => [row.city.value, row]))

  return [...rowsById.values()]
    .map(({ city, kinds, links }) => ({
      id: entityIdOf(city.value),
      kinds: kinds.value.split(' ').map(entityIdOf),
      sitelinks: Number(links.value)
    }))
    .filter(
      ({ id, kinds, sitelinks }) =>
        sitelinks >= CITY_SITELINKS_FLOOR &&
        !NOT_A_CITY_IDS.has(id) &&
        (kinds.includes(CITY) || !kinds.some((kind) => NOT_A_CITY.has(kind)))
    )
    .map(({ id, sitelinks }) => ({ id, sitelinks }))
    .toSorted((left, right) => right.sitelinks - left.sitelinks)
}

const CELL_PATTERN = /<td[^>]*>([\s\S]*?)<\/td>/g
const ROW_PATTERN = /<tr[^>]*>([\s\S]*?)<\/tr>/g

/**
 * The continent and the finest-but-one group of every country M49 lists, read
 * from the English table of the UN's overview page. Its columns are global,
 * region, subregion and intermediate region, each a code then a name, then
 * the country, its M49 code, ISO2 and ISO3.
 */
const m49Groups = async (): Promise<Map<string, M49Group>> => {
  const page = await cached('m49-overview.html', async () => {
    const response = await fetch(M49_URL, {
      headers: { 'user-agent': USER_AGENT }
    })

    if (!response.ok) {
      throw new Error(`${M49_URL} answered ${response.status}`)
    }

    return response.text()
  })
  const start = page.indexOf('id="ENG_Overview"')
  const end = page.indexOf('</table>', start)

  if (start === -1 || end === -1) {
    throw new Error('The M49 page holds no English table')
  }

  const groups = new Map<string, M49Group>()

  for (const [, row = ''] of page.slice(start, end).matchAll(ROW_PATTERN)) {
    const cells = [...row.matchAll(CELL_PATTERN)].map(([, cell = '']) =>
      cell.replace(/<[^>]+>/g, '').trim()
    )
    const [, , region, , subregion, , intermediate, , , , , iso3] = cells

    if (region !== undefined && subregion !== undefined && iso3) {
      groups.set(iso3, {
        region,
        subregion: intermediate || subregion
      })
    }
  }

  return groups
}

const checkedOverride = ({
  code,
  names,
  override
}: {
  code: CountryCode
  names: ReadonlyMap<string, Names>
  override: Override
}) => {
  for (const place of [override.capital, ...override.seats]) {
    const found = names.get(place.id)?.en

    if (found !== place.en) {
      throw new Error(
        `${code}: ${place.id} is ${found ?? 'unnamed'}, not ${place.en}`
      )
    }
  }

  return {
    capital: override.capital.id,
    seats: override.seats.map(({ id }) => id)
  }
}

const main = async () => {
  const states = await sovereignStates()
  const capitals = await currentCapitals(states)
  const overriddenIds = Object.values(CAPITAL_OVERRIDES).flatMap((override) =>
    override === undefined
      ? []
      : [override.capital.id, ...override.seats.map(({ id }) => id)]
  )
  const groups = await m49Groups()

  console.info(`${states.size} sovereign states the atlas draws`)

  const cityCandidates = new Map<CountryCode, CityCandidate[]>()

  for (const [code, state] of states) {
    cityCandidates.set(
      code,
      await largestCitiesOf(CITY_COUNTRY_OF[code] ?? state)
    )
  }

  const everyId = [
    ...[...capitals.values()].flat(),
    ...overriddenIds,
    ...[...cityCandidates.values()].flat().map(({ id }) => id)
  ]
  const names = await namesOf(everyId)
  const resolved = [...states].map(([code, state]) => {
    const override = CAPITAL_OVERRIDES[code]

    if (override !== undefined) {
      return { code, ...checkedOverride({ code, names, override }) }
    }

    const found = [...new Set(capitals.get(state) ?? [])]
    const [capital] = found

    if (capital === undefined || found.length > 1) {
      throw new Error(
        `${code} (${state}) has ${found.length} current capitals: ${found.join(', ')}`
      )
    }

    const seats: string[] = []

    return { capital, code, seats }
  })

  const placeIds = resolved.flatMap(({ capital, seats }) => [capital, ...seats])
  const points = await pointsOf(resolved.map(({ capital }) => capital))
  const aliasIds = [
    ...placeIds,
    ...[...cityCandidates.values()].flat().map(({ id }) => id)
  ]
  const aliases = {
    en: await aliasesOf({ entityIds: aliasIds, language: 'en' }),
    fr: await aliasesOf({ entityIds: aliasIds, language: 'fr' })
  }
  const views = await frenchViewsOf({
    entityIds: resolved.map(({ capital }) => capital),
    label: 'capitals'
  })

  const placeOf = (id: string) => {
    const placeNames = names.get(id)

    if (placeNames === undefined) {
      throw new Error(`${id} is not named in both languages`)
    }

    const otherNames = (language: keyof Names) =>
      (aliases[language].get(id) ?? []).filter(
        (alias) => alias !== placeNames[language]
      )

    return {
      aliases: { en: otherNames('en'), fr: otherNames('fr') },
      id,
      names: placeNames
    }
  }

  const rows: CapitalRow[] = resolved.map(({ capital, code, seats }) => {
    const point = points.get(capital)
    const group = groups.get(code) ?? M49_ADDED[code]

    if (point === undefined) {
      throw new Error(`${code}: ${capital} has no coordinates`)
    }

    if (group === undefined) {
      throw new Error(`${code} is in no M49 group`)
    }

    const official = new Set([capital, ...seats])
    const officialNames = new Set([...official].map((id) => names.get(id)?.en))
    const largestCities = (cityCandidates.get(code) ?? [])
      .filter(
        ({ id }) =>
          !official.has(id) &&
          names.has(id) &&
          !officialNames.has(names.get(id)?.en)
      )
      .slice(0, CITIES_PER_COUNTRY)
      .map(({ id, sitelinks }) => ({ ...placeOf(id), sitelinks }))

    return {
      capital: {
        ...placeOf(capital),
        isWellKnown: isWellKnownInFrench(views.get(capital) ?? 0),
        point
      },
      code,
      largestCities,
      region: group.region,
      seats: seats.map(placeOf),
      subregion: group.subregion
    }
  })

  const sorted = rows.toSorted((left, right) =>
    left.code < right.code ? -1 : 1
  )

  await writeFile(BANK_PATH, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')

  console.info(
    `${sorted.length} capitals, ${sorted.filter(({ capital }) => capital.isWellKnown).length} well known → ${BANK_PATH}`
  )
}

await main()
