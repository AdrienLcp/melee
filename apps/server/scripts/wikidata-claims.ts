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
 * The properties a prompt can name about its answer, and so the ones a decoy
 * has to share for the question to stay a question: *quel président des
 * États-Unis* is answered by somebody who held that office, and three decoys
 * who never did hand the room the answer.
 *
 * - **P17** — the country a place lies in
 * - **P21** — sex
 * - **P27** — citizenship
 * - **P39** — position held
 * - **P54** — team played for
 */
export const CONSTRAINED_PROPERTIES = [
  'P17',
  'P21',
  'P27',
  'P39',
  'P54'
] as const

export type ConstrainedProperty = (typeof CONSTRAINED_PROPERTIES)[number]

/** Entities per query: a politician holds dozens of positions, so fewer than the kinds lookup asks for. */
const ENTITIES_PER_QUERY = 150

/** How often what has been resolved is written back, in batches. */
const SAVE_EVERY = 10

/** Where the claims are remembered, an empty list meaning Wikidata holds none of the five. */
const CLAIMS_CACHE = 'wikidata-claims.json'

const claimsBindingsSchema = sparqlBindingsSchema({
  item: bindingValue,
  P17: bindingValue.optional(),
  P21: bindingValue.optional(),
  P27: bindingValue.optional(),
  P39: bindingValue.optional(),
  P54: bindingValue.optional()
})

const entityIdOf = (uri: string): string => uri.split('/').at(-1) ?? uri

/**
 * Sorted for the reason `wikidata-kinds.ts` gives: a rebuild reproduces the
 * bank rather than re-rolling it on the order the endpoint concatenates in.
 */
const factsOf = ({
  concatenated,
  property
}: {
  concatenated: string | undefined
  property: ConstrainedProperty
}): string[] =>
  (concatenated ?? '')
    .split(' ')
    .filter((uri) => uri !== '')
    .map((uri) => `${property}:${entityIdOf(uri)}`)
    .toSorted()

const claimsOfBatch = async (
  entityIds: readonly string[]
): Promise<Map<string, string[]>> => {
  const values = entityIds.map((entityId) => `wd:${entityId}`).join(' ')
  const query = [
    'SELECT ?item',
    ...CONSTRAINED_PROPERTIES.map(
      (property) =>
        `  (GROUP_CONCAT(DISTINCT ?${property}value; separator=" ") AS ?${property})`
    ),
    'WHERE {',
    `  VALUES ?item { ${values} }`,
    ...CONSTRAINED_PROPERTIES.map(
      (property) => `  OPTIONAL { ?item wdt:${property} ?${property}value }`
    ),
    '}',
    'GROUP BY ?item'
  ].join('\n')

  const body = await withRetries(claimsBindingsSchema, async () =>
    fetch(SPARQL_URL, {
      body: new URLSearchParams({ query }),
      headers: {
        accept: 'application/sparql-results+json',
        'user-agent': USER_AGENT
      },
      method: 'POST'
    })
  )

  const claims = new Map<string, string[]>(
    entityIds.map((entityId) => [entityId, []])
  )

  for (const binding of body.results.bindings) {
    claims.set(
      entityIdOf(binding.item.value),
      CONSTRAINED_PROPERTIES.flatMap((property) =>
        factsOf({ concatenated: binding[property]?.value, property })
      )
    )
  }

  return claims
}

/**
 * Each entity's values of the five properties, as `P27:Q30` facts, resumable
 * across runs the way the kinds and birth-date lookups are.
 */
export const claimsOf = async ({
  entityIds
}: {
  entityIds: readonly string[]
}): Promise<Map<string, string[]>> => {
  const cached = await readCachedEntries(CLAIMS_CACHE, z.array(z.string()))
  const missing = [
    ...new Set(entityIds.filter((entityId) => !(entityId in cached)))
  ]

  console.info(
    `  claims: ${entityIds.length - missing.length} known, ${missing.length} to resolve`
  )

  let batch = 0

  for (let start = 0; start < missing.length; start += ENTITIES_PER_QUERY) {
    const resolved = await claimsOfBatch(
      missing.slice(start, start + ENTITIES_PER_QUERY)
    )

    for (const [entityId, facts] of resolved) {
      cached[entityId] = facts
    }

    batch++

    if (batch % SAVE_EVERY === 0) {
      await writeCachedEntries({ entries: cached, name: CLAIMS_CACHE })
    }
  }

  await writeCachedEntries({ entries: cached, name: CLAIMS_CACHE })

  return new Map(Object.entries(cached))
}
