import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CountryCode } from '@melee/protocol/country-code'
import {
  WIKIDATA_QUANTITY_FAMILIES,
  type WikidataQuantityFamily
} from '@melee/protocol/estimate'

import type { QuantityRow } from '../src/infrastructure/questions/quantity-bank'
import {
  isWellKnownInFrench,
  type WikipediaLanguage,
  wikipediaViewsOf
} from './frwiki-notability'
import { orStop, parseJson } from './json-file'
import { cached } from './question-source'
import { type Names, namesOf } from './wikidata-names'
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
  '../src/infrastructure/questions/quantity-bank.json'
)

const SIGNIFICANT_FIGURES = 3

/**
 * The countries a table can sit in, each by its Wikidata item and the
 * Wikipedia its table reads — whose traffic says what that table has heard of.
 */
const HOME_COUNTRIES = [
  { code: 'FRA', entity: 'Q142', wiki: 'fr' },
  { code: 'PRT', entity: 'Q45', wiki: 'pt' }
] as const satisfies readonly {
  code: CountryCode
  entity: string
  wiki: WikipediaLanguage
}[]

const HOME_COUNTRY_OF_ENTITY: ReadonlyMap<string, CountryCode> = new Map(
  HOME_COUNTRIES.map(({ code, entity }) => [entity, code])
)

/** Below this an article is a stub only its own region's wiki wrote. */
const SITELINKS_FLOOR = 20

/**
 * A structure in Portugal is written about in fewer wikis — the Cabo da
 * Roca's lighthouse has a dozen — and the Portuguese article a Portuguese
 * source demands is what keeps a stub out instead.
 */
const PORTUGUESE_SITELINKS_FLOOR = 10

const MIN_CITY_POPULATION = 500_000

/**
 * The Kingdom of the Netherlands stands for its European country, and Denmark's
 * realm for Denmark: Wikidata files the two countries a table means outside
 * the sovereign-state class. Israel and Palestine are left out as the capital
 * bank leaves them out — a party game does not referee an area or a census.
 */
const COUNTRIES = `{
    ?item wdt:P31 wd:Q3624078; wdt:P298 ?iso.
    FILTER NOT EXISTS { ?item wdt:P576 ?dissolved }
    FILTER(?item NOT IN (wd:Q29999, wd:Q756617, wd:Q801, wd:Q219060))
  } UNION { VALUES ?item { wd:Q35 wd:Q55 } }`

/**
 * A city, a big city, a million city, a metropolis, a capital and an
 * independent city — asked as direct classes, because the subclass walk under
 * *city* reaches every metropolitan area and province that counts its own
 * millions, and Greater Buenos Aires is not the city a table is asked about.
 */
const CITIES = `?item wdt:P31 ?kind.
    VALUES ?kind { wd:Q515 wd:Q1549591 wd:Q1637706 wd:Q200250 wd:Q5119 wd:Q22865 }
    FILTER NOT EXISTS { ?item wdt:P576 ?dissolved }`

/**
 * The French towns a table has a picture of: every commune of a hundred
 * thousand people, and every prefecture however small — Guéret beside
 * Limoges is a comparison a French table can make, and Shenyang is not. A
 * seat is a prefecture while it has no end date: Gray and Navarrenx were one
 * once. Paris is asked by name, because Wikidata files it as a department
 * and a capital rather than as a commune.
 */
const FRENCH_TOWNS = `{
      ?item wdt:P31 wd:Q484170.
      {
        ?item p:P1376 ?seatOf. ?seatOf ps:P1376 ?seat.
        ?seat wdt:P31 wd:Q6465.
        FILTER NOT EXISTS { ?seatOf pq:P582 ?until }
      } UNION {
        ?item wdt:P1082 ?people. FILTER(?people >= 100000)
      }
    } UNION { VALUES ?item { wd:Q90 } }`

const FRENCH_REGIONS = `?item wdt:P31 wd:Q36784.
    FILTER NOT EXISTS { ?item wdt:P576 ?dissolved }`

/** Paris is a commune and a department at once, and asked as the commune. */
const FRENCH_DEPARTMENTS = `?item wdt:P31 wd:Q6465.
    FILTER NOT EXISTS { ?item wdt:P576 ?dissolved }
    FILTER NOT EXISTS { ?item wdt:P31 wd:Q484170 }`

const MOUNTAINS = `?item wdt:P31 ?kind.
    VALUES ?kind { wd:Q8502 wd:Q8072 wd:Q169358 wd:Q207326 }`

const RIVERS = '?item wdt:P31 wd:Q4022.'

/**
 * The Portuguese towns a table in Lisbon has a picture of: every municipality
 * of twenty thousand people, which takes in every district's seat. Lisbon
 * is asked by name: Wikidata files it as a capital rather than a
 * municipality, and the world's cities miss it too.
 */
const PORTUGUESE_TOWNS = `{
      ?item wdt:P31 wd:Q13217644; wdt:P1082 ?people.
      FILTER(?people >= 20000)
    } UNION { VALUES ?item { wd:Q597 } }`

const IN_PORTUGAL = '?item wdt:P17 wd:Q45.'

/**
 * What a table in Lisbon asks the height of, by hand: a tower, a statue or a
 * church is in no class the skyscrapers are read from.
 */
const PORTUGUESE_LANDMARKS = `VALUES ?item { ${[
  'Q1366918',
  'Q805446',
  'Q9167690',
  'Q3134299',
  'Q1133712',
  'Q10280159',
  'Q215003',
  'Q11681789',
  'Q8960874',
  'Q9300521',
  'Q5150196',
  'Q5015743',
  'Q10280171'
]
  .map((entity) => `wd:${entity}`)
  .join(' ')} }`

type ArticleWiki = 'en' | WikipediaLanguage

/**
 * Skyscrapers and towers standing today: a demolished one has no height to
 * ask, and one under construction or only proposed — the Jeddah Tower, the
 * second World Trade Center — carries the height it is meant to reach.
 */
const BUILDINGS = `?item wdt:P31 ?kind.
    VALUES ?kind { wd:Q11303 wd:Q12518 wd:Q11166728 wd:Q1440300 wd:Q18142 }
    FILTER NOT EXISTS { ?item wdt:P576 ?demolished }
    FILTER NOT EXISTS {
      ?item wdt:P5817 ?unbuilt.
      VALUES ?unbuilt { wd:Q12377751 wd:Q811683 wd:Q1105330 }
    }`

type FamilySource = {
  entities: string
  /**
   * The country whose table alone is dealt what this source measures, and
   * `null` for a source of the world's, which wins over a country's own: Paris
   * is measured as a French town and as a city of the world, and is everyone's.
   */
  homeCountry: CountryCode | null
  /** Below this an article is a stub only its own region's wiki wrote. */
  sitelinksFloor: number
  /** The Wikipedias an entity must have an article in, which its names and its traffic are read from. */
  wikis: readonly ArticleWiki[]
  /** What turns the statement's value into the family's unit. */
  inUnit: (amount: number) => number
  minimum: number
  property: string
  /**
   * A quantity with a unit is read normalised to SI — an elevation filed in
   * feet comes back in metres — and a count has no unit to normalise.
   */
  isCount: boolean
}

const asIs = (amount: number): number => amount

const fromSquareMetres = (squareMetres: number): number => squareMetres / 1e6

const WORLD = {
  homeCountry: null,
  sitelinksFloor: SITELINKS_FLOOR,
  wikis: ['en', 'fr']
} as const

const FRENCH = {
  homeCountry: 'FRA',
  sitelinksFloor: SITELINKS_FLOOR,
  wikis: ['en', 'fr']
} as const

const PORTUGUESE = {
  homeCountry: 'PRT',
  sitelinksFloor: PORTUGUESE_SITELINKS_FLOOR,
  wikis: ['en', 'pt']
} as const

type Scope = typeof WORLD | typeof FRENCH | typeof PORTUGUESE

const areaOf = ({
  entities,
  scope
}: {
  entities: string
  scope: Scope
}): FamilySource => ({
  ...scope,
  entities,
  inUnit: fromSquareMetres,
  isCount: false,
  minimum: 0,
  property: 'P2046'
})

const populationOf = ({
  entities,
  scope
}: {
  entities: string
  scope: Scope
}): FamilySource => ({
  ...scope,
  entities,
  inUnit: asIs,
  isCount: true,
  minimum: 0,
  property: 'P1082'
})

const elevationOf = ({
  entities,
  scope
}: {
  entities: string
  scope: Scope
}): FamilySource => ({
  ...scope,
  entities,
  inUnit: asIs,
  isCount: false,
  minimum: 0,
  property: 'P2044'
})

const heightOf = ({
  entities,
  scope
}: {
  entities: string
  scope: Scope
}): FamilySource => ({
  ...scope,
  entities,
  inUnit: asIs,
  isCount: false,
  minimum: 0,
  property: 'P2048'
})

const lengthOf = ({
  entities,
  scope
}: {
  entities: string
  scope: Scope
}): FamilySource => ({
  ...scope,
  entities,
  inUnit: (metres) => metres / 1_000,
  isCount: false,
  minimum: 0,
  property: 'P2043'
})

const SOURCES: Record<WikidataQuantityFamily, readonly FamilySource[]> = {
  'area.city': [
    areaOf({ entities: FRENCH_TOWNS, scope: FRENCH }),
    areaOf({ entities: PORTUGUESE_TOWNS, scope: PORTUGUESE })
  ],
  'area.country': [areaOf({ entities: COUNTRIES, scope: WORLD })],
  'area.department': [areaOf({ entities: FRENCH_DEPARTMENTS, scope: FRENCH })],
  'area.region': [areaOf({ entities: FRENCH_REGIONS, scope: FRENCH })],
  'elevation.mountain': [
    elevationOf({ entities: MOUNTAINS, scope: WORLD }),
    elevationOf({
      entities: `${MOUNTAINS}\n    ${IN_PORTUGAL}`,
      scope: PORTUGUESE
    })
  ],
  'height.building': [
    heightOf({ entities: BUILDINGS, scope: WORLD }),
    heightOf({
      entities: `${BUILDINGS}\n    ${IN_PORTUGAL}`,
      scope: PORTUGUESE
    }),
    heightOf({ entities: PORTUGUESE_LANDMARKS, scope: PORTUGUESE })
  ],
  'length.river': [
    lengthOf({ entities: RIVERS, scope: WORLD }),
    lengthOf({ entities: `${RIVERS}\n    ${IN_PORTUGAL}`, scope: PORTUGUESE })
  ],
  'population.city': [
    {
      ...WORLD,
      entities: CITIES,
      inUnit: asIs,
      isCount: true,
      minimum: MIN_CITY_POPULATION,
      property: 'P1082'
    },
    populationOf({ entities: FRENCH_TOWNS, scope: FRENCH }),
    populationOf({ entities: PORTUGUESE_TOWNS, scope: PORTUGUESE })
  ],
  'population.country': [populationOf({ entities: COUNTRIES, scope: WORLD })],
  'population.department': [
    populationOf({ entities: FRENCH_DEPARTMENTS, scope: FRENCH })
  ],
  'population.region': [
    populationOf({ entities: FRENCH_REGIONS, scope: FRENCH })
  ]
}

/** Where Wikidata's label is the official form, the name a table says. */
const NAMES_SAID: Readonly<Record<string, Names>> = {
  Q148: { en: 'China', fr: 'Chine', pt: 'China' }
}

const entityIdOf = (uri: string): string => uri.split('/').at(-1) ?? uri

type Measured = {
  entity: string
  homeCountry: CountryCode | null
  liesIn: CountryCode[]
  sitelinks: number
  value: number
}

/**
 * Every best-ranked value of the property on every entity that has an article
 * in each of the source's Wikipedias, the most recent where several stand — a
 * census beside the one before it. Run in the order written: left to plan it, the service
 * walks every English article before the class and times out.
 */
const measured = async (source: FamilySource): Promise<Measured[]> => {
  const valuePath = source.isCount
    ? `ps:${source.property}`
    : `psn:${source.property}/wikibase:quantityAmount`
  const articles = source.wikis
    .map(
      (wiki) =>
        `?${wiki}Article schema:about ?item; schema:isPartOf <https://${wiki}.wikipedia.org/>.`
    )
    .join('\n    ')
  const homes = HOME_COUNTRIES.map(({ entity }) => `wd:${entity}`).join(', ')
  const query = `SELECT ?item ?amount ?date ?links ?home WHERE {
    hint:Query hint:optimizer "None".
    ${source.entities}
    ?item wikibase:sitelinks ?links; p:${source.property} ?statement.
    FILTER(?links >= ${source.sitelinksFloor})
    ?statement a wikibase:BestRank; ${valuePath} ?amount.
    OPTIONAL { ?statement pq:P585 ?date }
    ${articles}
    OPTIONAL { ?item wdt:P17 ?home. FILTER(?home IN (${homes})) }
  }`
  const schema = sparqlBindingsSchema({
    amount: bindingValue,
    date: bindingValue.optional(),
    home: bindingValue.optional(),
    item: bindingValue,
    links: bindingValue
  })
  const hash = createHash('sha1').update(query).digest('hex').slice(0, 16)
  const text = await cached(`quantities-${hash}.json`, async () =>
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
  const latest = new Map<string, Measured & { date: string }>()
  const homesOf = new Map<string, Set<CountryCode>>()

  for (const { amount, date, home, item, links } of orStop(
    parseJson(text, schema),
    hash
  ).results.bindings) {
    const entity = entityIdOf(item.value)
    const value = source.inUnit(Number(amount.value))
    const stated = date?.value ?? ''
    const held = latest.get(entity)
    const homes = homesOf.get(entity) ?? new Set<CountryCode>()
    const itself = HOME_COUNTRY_OF_ENTITY.get(entity)
    const lying =
      home === undefined
        ? undefined
        : HOME_COUNTRY_OF_ENTITY.get(entityIdOf(home.value))

    for (const code of [itself, lying]) {
      if (code !== undefined) {
        homes.add(code)
      }
    }

    homesOf.set(entity, homes)

    if (
      held === undefined ||
      stated > held.date ||
      (stated === held.date && value > held.value)
    ) {
      latest.set(entity, {
        date: stated,
        entity,
        homeCountry: source.homeCountry,
        liesIn: [],
        sitelinks: Number(links.value),
        value
      })
    }
  }

  return [...latest.values()]
    .filter(({ value }) => Number.isFinite(value) && value > source.minimum)
    .map(({ date: _, entity, ...quantity }) => ({
      ...quantity,
      entity,
      liesIn: [...(homesOf.get(entity) ?? [])].toSorted()
    }))
}

const roundedToFigures = (value: number): number =>
  Number(value.toPrecision(SIGNIFICANT_FIGURES))

/**
 * One row per name in a family: two rivers both called *Colorado* are one
 * question a table cannot tell apart, so the one more wikis write about keeps it.
 */
const oneRowPerName = (
  rows: readonly (QuantityRow & { sitelinks: number })[]
): (QuantityRow & { sitelinks: number })[] => {
  const byName = new Map<string, QuantityRow & { sitelinks: number }>()

  for (const row of rows.toSorted(
    (left, right) => right.sitelinks - left.sitelinks
  )) {
    const key = `${row.family}:${row.names.fr.toLowerCase()}`

    if (!byName.has(key)) {
      byName.set(key, row)
    }
  }

  return [...byName.values()]
}

const main = async () => {
  const rows: (QuantityRow & { sitelinks: number })[] = []

  for (const family of WIKIDATA_QUANTITY_FAMILIES) {
    const found = new Map<string, Measured>()

    for (const source of SOURCES[family]) {
      for (const quantity of await measured(source)) {
        const held = found.get(quantity.entity)

        if (held === undefined || held.homeCountry !== null) {
          found.set(quantity.entity, quantity)
        }
      }
    }

    const entityIds = [...found.keys()]
    const names = await namesOf({ cache: 'quantity-labels.json', entityIds })
    const viewsByCountry = new Map<CountryCode, Map<string, number>>()

    for (const { code, wiki } of HOME_COUNTRIES) {
      viewsByCountry.set(
        code,
        await wikipediaViewsOf({ entityIds, label: family, language: wiki })
      )
    }

    for (const {
      entity,
      homeCountry,
      liesIn,
      sitelinks,
      value
    } of found.values()) {
      const entityNames = NAMES_SAID[entity] ?? names.get(entity)

      if (entityNames !== undefined) {
        rows.push({
          entity,
          family,
          homeCountry,
          liesIn,
          names: entityNames,
          sitelinks,
          value: roundedToFigures(value),
          wellKnownIn: HOME_COUNTRIES.filter(({ code }) =>
            isWellKnownInFrench(viewsByCountry.get(code)?.get(entity) ?? 0)
          ).map(({ code }) => code)
        })
      }
    }

    console.info(`${family}: ${found.size} measured`)
  }

  const banked = oneRowPerName(rows)
    .map(({ sitelinks: _, ...row }) => row)
    .toSorted((left, right) =>
      left.family === right.family
        ? left.entity.localeCompare(right.entity)
        : left.family.localeCompare(right.family)
    )

  await writeFile(BANK_PATH, `${JSON.stringify(banked, null, 2)}\n`, 'utf8')

  console.info(
    `${banked.length} quantities, ${banked.filter(({ homeCountry }) => homeCountry !== null).length} of one country's table → ${BANK_PATH}`
  )
}

await main()
