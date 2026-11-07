import { z } from 'zod'

import { readCachedEntries, writeCachedEntries } from './question-source'
import {
  bindingValue,
  SPARQL_URL,
  sparqlBindingsSchema,
  USER_AGENT,
  withRetries
} from './wikimedia-client'

/**
 * Which franchise a work belongs to, which is what keeps a *Guess nine* grid
 * from hiding four *Shrek* behind DreamWorks, and when it came out, because
 * ranking by traffic lets in a sequel nobody has seen yet.
 *
 * The franchise is read from the series (P179) and the media franchise
 * (P8345). The works a work follows and is followed by (P155, P156) were read
 * too and are not kept: on a book or a film they are as often the author's
 * bibliography as a sequel, and they put *1984* and *Animal Farm* in one
 * franchise, *No Country for Old Men* and *A Serious Man* in another.
 */
export type SeriesFacts = {
  /** Every series and franchise it belongs to, as entity ids. */
  belongsTo: string[]
  /** Its earliest publication date, `YYYY-MM-DD`, or `null` when Wikidata holds none. */
  releasedOn: string | null
}

/**
 * Smaller than the aliases' batch: a franchise film holds several dates and
 * series, and the endpoint answers their product before grouping.
 */
const ENTITIES_PER_QUERY = 100

const SAVE_EVERY = 10

const SERIES_CACHE = 'wikidata-series.json'

const seriesFactsSchema = z.object({
  belongsTo: z.array(z.string()),
  releasedOn: z.string().nullable()
})

const seriesBindingsSchema = sparqlBindingsSchema({
  belongsTo: bindingValue.optional(),
  item: bindingValue,
  releasedOn: bindingValue.optional()
})

const entityIdOf = (uri: string): string => uri.split('/').at(-1) ?? uri

/** Sorted, so a rebuild reads the same facts whatever order the endpoint chose. */
const idsIn = (concatenated: string | undefined): string[] =>
  [
    ...new Set(
      (concatenated ?? '')
        .split(' ')
        .filter((uri) => uri.length > 0)
        .map(entityIdOf)
    )
  ].toSorted()

const seriesFactsOfBatch = async (
  entityIds: readonly string[]
): Promise<Map<string, SeriesFacts>> => {
  const values = entityIds.map((entityId) => `wd:${entityId}`).join(' ')
  const query = [
    'SELECT ?item',
    '  (GROUP_CONCAT(DISTINCT ?series; separator=" ") AS ?belongsTo)',
    '  (MIN(?date) AS ?releasedOn)',
    'WHERE {',
    `  VALUES ?item { ${values} }`,
    '  OPTIONAL { ?item wdt:P179|wdt:P8345 ?series }',
    '  OPTIONAL { ?item wdt:P577 ?date }',
    '}',
    'GROUP BY ?item'
  ].join('\n')

  const body = await withRetries(seriesBindingsSchema, async () =>
    fetch(SPARQL_URL, {
      body: new URLSearchParams({ query }),
      headers: {
        accept: 'application/sparql-results+json',
        'user-agent': USER_AGENT
      },
      method: 'POST'
    })
  )

  const facts = new Map<string, SeriesFacts>(
    entityIds.map((entityId) => [entityId, { belongsTo: [], releasedOn: null }])
  )

  for (const { belongsTo, item, releasedOn } of body.results.bindings) {
    facts.set(entityIdOf(item.value), {
      belongsTo: idsIn(belongsTo?.value),
      releasedOn: releasedOn?.value.slice(0, 10) ?? null
    })
  }

  return facts
}

/** The series facts of every entity, resumable across runs like the aliases. */
export const seriesFactsOf = async ({
  entityIds
}: {
  entityIds: readonly string[]
}): Promise<Map<string, SeriesFacts>> => {
  const cached = await readCachedEntries(SERIES_CACHE, seriesFactsSchema)
  const missing = [
    ...new Set(entityIds.filter((entityId) => !(entityId in cached)))
  ]

  console.info(
    `  series: ${entityIds.length - missing.length} known, ${missing.length} to resolve`
  )

  let batch = 0

  for (let start = 0; start < missing.length; start += ENTITIES_PER_QUERY) {
    const resolved = await seriesFactsOfBatch(
      missing.slice(start, start + ENTITIES_PER_QUERY)
    )

    for (const [entityId, facts] of resolved) {
      cached[entityId] = facts
    }

    batch++

    if (batch % SAVE_EVERY === 0) {
      await writeCachedEntries({ entries: cached, name: SERIES_CACHE })
    }
  }

  await writeCachedEntries({ entries: cached, name: SERIES_CACHE })

  return new Map(Object.entries(cached))
}
