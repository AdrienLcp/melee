import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  QUANTITY_FAMILIES,
  type QuantityFamily
} from '@melee/protocol/estimate'

import type { QuantityRow } from '../src/infrastructure/questions/quantity-bank'
import { frenchViewsOf, isWellKnownInFrench } from './frwiki-notability'
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

/** Below this an article is a stub only its own region's wiki wrote. */
const SITELINKS_FLOOR = 20

const MIN_CITY_POPULATION = 500_000
const MIN_FRENCH_CITY_POPULATION = 100_000

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

const FRENCH_COMMUNES = 'VALUES ?kind { wd:Q484170 } ?item wdt:P31 ?kind.'

const MOUNTAINS = `?item wdt:P31 ?kind.
    VALUES ?kind { wd:Q8502 wd:Q8072 wd:Q169358 wd:Q207326 }`

const RIVERS = '?item wdt:P31 wd:Q4022.'

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

const SOURCES: Record<QuantityFamily, readonly FamilySource[]> = {
  'area.country': [
    {
      entities: COUNTRIES,
      inUnit: (squareMetres) => squareMetres / 1e6,
      minimum: 0,
      property: 'P2046',
      isCount: false
    }
  ],
  'elevation.mountain': [
    {
      entities: MOUNTAINS,
      inUnit: asIs,
      minimum: 0,
      property: 'P2044',
      isCount: false
    }
  ],
  'height.building': [
    {
      entities: BUILDINGS,
      inUnit: asIs,
      minimum: 0,
      property: 'P2048',
      isCount: false
    }
  ],
  'length.river': [
    {
      entities: RIVERS,
      inUnit: (metres) => metres / 1_000,
      minimum: 0,
      property: 'P2043',
      isCount: false
    }
  ],
  'population.city': [
    {
      entities: CITIES,
      inUnit: asIs,
      minimum: MIN_CITY_POPULATION,
      property: 'P1082',
      isCount: true
    },
    {
      entities: FRENCH_COMMUNES,
      inUnit: asIs,
      minimum: MIN_FRENCH_CITY_POPULATION,
      property: 'P1082',
      isCount: true
    }
  ],
  'population.country': [
    {
      entities: COUNTRIES,
      inUnit: asIs,
      minimum: 0,
      property: 'P1082',
      isCount: true
    }
  ]
}

/** Where Wikidata's label is the official form, the name a table says. */
const NAMES_SAID: Readonly<Record<string, Names>> = {
  Q148: { en: 'China', fr: 'Chine' }
}

const entityIdOf = (uri: string): string => uri.split('/').at(-1) ?? uri

type Measured = { entity: string; sitelinks: number; value: number }

/**
 * Every best-ranked value of the property on every entity that has an article
 * in both Wikipedias, the most recent where several stand — a census beside
 * the one before it. Run in the order written: left to plan it, the service
 * walks every English article before the class and times out.
 */
const measured = async (source: FamilySource): Promise<Measured[]> => {
  const valuePath = source.isCount
    ? `ps:${source.property}`
    : `psn:${source.property}/wikibase:quantityAmount`
  const query = `SELECT ?item ?amount ?date ?links WHERE {
    hint:Query hint:optimizer "None".
    ${source.entities}
    ?item wikibase:sitelinks ?links; p:${source.property} ?statement.
    FILTER(?links >= ${SITELINKS_FLOOR})
    ?statement a wikibase:BestRank; ${valuePath} ?amount.
    OPTIONAL { ?statement pq:P585 ?date }
    ?english schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>.
    ?french schema:about ?item; schema:isPartOf <https://fr.wikipedia.org/>.
  }`
  const schema = sparqlBindingsSchema({
    amount: bindingValue,
    date: bindingValue.optional(),
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

  for (const { amount, date, item, links } of orStop(
    parseJson(text, schema),
    hash
  ).results.bindings) {
    const entity = entityIdOf(item.value)
    const value = source.inUnit(Number(amount.value))
    const stated = date?.value ?? ''
    const held = latest.get(entity)

    if (
      held === undefined ||
      stated > held.date ||
      (stated === held.date && value > held.value)
    ) {
      latest.set(entity, {
        date: stated,
        entity,
        sitelinks: Number(links.value),
        value
      })
    }
  }

  return [...latest.values()]
    .filter(({ value }) => Number.isFinite(value) && value > source.minimum)
    .map(({ entity, sitelinks, value }) => ({ entity, sitelinks, value }))
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

  for (const family of QUANTITY_FAMILIES) {
    const found = new Map<string, Measured>()

    for (const source of SOURCES[family]) {
      for (const quantity of await measured(source)) {
        found.set(quantity.entity, quantity)
      }
    }

    const entityIds = [...found.keys()]
    const names = await namesOf({ cache: 'quantity-labels.json', entityIds })
    const views = await frenchViewsOf({ entityIds, label: family })

    for (const { entity, sitelinks, value } of found.values()) {
      const entityNames = NAMES_SAID[entity] ?? names.get(entity)

      if (entityNames !== undefined) {
        rows.push({
          entity,
          family,
          isWellKnown: isWellKnownInFrench(views.get(entity) ?? 0),
          names: entityNames,
          sitelinks,
          value: roundedToFigures(value)
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
    `${banked.length} quantities, ${banked.filter(({ isWellKnown }) => isWellKnown).length} well known → ${BANK_PATH}`
  )
}

await main()
