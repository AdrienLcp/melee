import { z } from 'zod'

import {
  chunked,
  readCachedEntries,
  writeCachedEntries
} from './question-source'
import { USER_AGENT, withRetries } from './wikimedia-client'

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php'

const labelsSchema = z.object({
  entities: z.record(
    z.string(),
    z.object({
      labels: z.record(z.string(), z.object({ value: z.string() })).optional()
    })
  )
})

export type Names = { en: string; fr: string }

/**
 * Both names of each entity, read from the action API: the query service is
 * silent on some labels (Oslo in French, St. John's in English) that the
 * database holds, and the language-neutral `mul` label stands in where a
 * language has none. An entity missing either name is left out of the map.
 */
export const namesOf = async ({
  cache,
  entityIds
}: {
  cache: string
  entityIds: readonly string[]
}): Promise<Map<string, Names>> => {
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
