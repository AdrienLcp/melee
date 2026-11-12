import { z } from 'zod'

import {
  FRENCH_WIKIPEDIA_API,
  frenchTitlesOf,
  refreshedFrenchTitlesOf
} from './frwiki-notability'
import {
  chunked,
  readCachedEntries,
  writeCachedEntries
} from './question-source'
import { wait } from './wait'
import { USER_AGENT, withRetries } from './wikimedia-client'

/**
 * How many French readers an entity's article draws in a typical year — its
 * median month over the last twelve whole months, times twelve — for a ranking
 * that must not follow the news.
 *
 * `frenchViewsOf` reads sixty days, the widest window `prop=pageviews` serves,
 * and sixty days read in October is Nobel season. A year's _sum_ was tried
 * first and still bent: a series about James Garfield put him sixth of the
 * American presidents on one month's spike, a Netflix _Seven Dials_ put it
 * first of Agatha Christie, a death put _The Birds_ over _Psycho_. The median
 * ignores up to five months of news; a work read for half the year still
 * counts. The REST endpoint serves one article per request, so it is paid only
 * where the order is read — a theme's true answers, not every candidate.
 */
const PER_ARTICLE_URL =
  'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia/all-access/user'

/**
 * Wikimedia serves a client whose User-Agent names a contact two hundred
 * requests a minute, and an anonymous one ten — the shared `USER_AGENT` is
 * what keeps a run at twenty minutes rather than four hours. The pace adds to
 * `withRetries`' own interval to stay well under the two hundred.
 */
const PACE_MS = 250

const RATE_LIMIT_PAUSE_MS = 60_000

const MONTHS_READ = 12

const SAVE_EVERY = 100

const TITLES_PER_REQUEST = 50

/** Views per month, keyed by the endpoint's own stamp (`2025110100`). */
const monthlyViewsSchema = z.record(z.string(), z.number())

type MonthlyViews = z.infer<typeof monthlyViewsSchema>

const perArticleSchema = z.object({
  items: z.array(z.object({ timestamp: z.string(), views: z.number() }))
})

/** What the endpoint's 404 means: an article never read, or none at all. */
const NO_FIGURE = JSON.stringify({ items: [] })

const continuationSchema = z.record(z.string(), z.string())

const redirectsPageSchema = z.object({
  continue: continuationSchema.optional(),
  query: z.object({
    pages: z.array(
      z.object({
        redirects: z
          .array(z.object({ pageid: z.number(), title: z.string() }))
          .optional(),
        title: z.string()
      })
    ),
    redirects: z
      .array(z.object({ from: z.string(), to: z.string() }))
      .optional()
  })
})

const logEventsSchema = z.object({
  query: z.object({
    logevents: z.array(z.object({ pageid: z.number().optional() }))
  })
})

type Window = { from: string; until: string }

const stampOfMonth = (monthsSinceYearZero: number): string => {
  const year = Math.floor(monthsSinceYearZero / 12)
  const month = (monthsSinceYearZero % 12) + 1

  return `${year}${String(month).padStart(2, '0')}0100`
}

const isoOfStamp = (stamp: string): string =>
  `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-01T00:00:00Z`

/**
 * The twelve months before the current one. The endpoint clips the last
 * bucket to the end stamp, so the request runs to the first of the current
 * month and that partial bucket is dropped. The window names the caches: a
 * figure compares only with one read over the same months, and the sixty-day
 * cache, keyed by title alone, kept October's numbers through a rebuild in
 * November.
 */
const lastWholeYearBefore = (today: string): Window => {
  const [year = 0, month = 1] = today.split('-').map(Number)
  const current = year * 12 + month - 1

  return {
    from: stampOfMonth(current - MONTHS_READ),
    until: stampOfMonth(current)
  }
}

/**
 * A 429 is Wikimedia's per-minute budget spent, not a failure: it is waited
 * out (for `retry-after` when it says, a minute when it does not) and asked
 * again, where `withRetries` would give up a two-thousand-request run on its
 * fifth.
 */
const admittedFetch = async (url: string): Promise<Response> => {
  for (;;) {
    const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } })

    if (response.status !== 429) {
      return response
    }

    const retryAfterMs = Number(response.headers.get('retry-after')) * 1_000
    const pauseMs = retryAfterMs > 0 ? retryAfterMs : RATE_LIMIT_PAUSE_MS

    console.info(`    rate limited, waiting ${pauseMs / 1_000}s`)
    await wait(pauseMs)
  }
}

const askFrenchWikipedia = async <TSchema extends z.ZodType>({
  parameters,
  schema
}: {
  parameters: Record<string, string>
  schema: TSchema
}): Promise<z.infer<TSchema>> => {
  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    ...parameters
  })

  return withRetries(schema, async () =>
    admittedFetch(`${FRENCH_WIKIPEDIA_API}?${query}`)
  )
}

const monthlyViewsOfTitle = async ({
  title,
  window: { from, until }
}: {
  title: string
  window: Window
}): Promise<MonthlyViews> => {
  const article = encodeURIComponent(title.replaceAll(' ', '_'))
  const { items } = await withRetries(perArticleSchema, async () => {
    const response = await admittedFetch(
      `${PER_ARTICLE_URL}/${article}/monthly/${from}/${until}`
    )

    return response.status === 404 ? new Response(NO_FIGURE) : response
  })

  return Object.fromEntries(
    items
      .filter(({ timestamp }) => timestamp < until)
      .map(({ timestamp, views }) => [timestamp, views])
  )
}

/**
 * Page ids only grow, and a move leaves a fresh redirect page at the title it
 * leaves, so a redirect older than the window's first page cannot be a title
 * the article left during it. That spares a move log request for each of the
 * five thousand redirects the truths carry, of which a hundred are that young.
 */
const firstPageIdOf = async ({ from }: Window): Promise<number> => {
  const { query } = await askFrenchWikipedia({
    parameters: {
      ledir: 'newer',
      lelimit: '1',
      lenamespace: '0',
      lestart: isoOfStamp(from),
      letype: 'create',
      list: 'logevents'
    },
    schema: logEventsSchema
  })

  return query.logevents[0]?.pageid ?? Number.POSITIVE_INFINITY
}

/**
 * A young redirect is a title the article left only if the move log says so:
 * the rest are names added during the year (_Porteur de l'Anneau_ for Frodo),
 * and summing every alias would credit an article with the readers of whatever
 * points at it — a band with its members, _Isengard_ with _Orthanc_.
 */
const wasMovedDuring = async ({
  title,
  window: { from, until }
}: {
  title: string
  window: Window
}): Promise<boolean> => {
  const { query } = await askFrenchWikipedia({
    parameters: {
      leend: isoOfStamp(from),
      lelimit: '1',
      lestart: isoOfStamp(until),
      letitle: title,
      letype: 'move',
      list: 'logevents'
    },
    schema: logEventsSchema
  })

  return query.logevents.length > 0
}

/**
 * Lists the titles each article left during the window into `formerTitles`,
 * and returns the asked titles that are themselves redirects now, each to the
 * article it leads to.
 */
const listFormerTitlesInto = async ({
  formerTitles,
  titles,
  window
}: {
  formerTitles: Record<string, string[]>
  titles: readonly string[]
  window: Window
}): Promise<Map<string, string>> => {
  const leadingElsewhere = new Map<string, string>()
  const unlisted = [...new Set(titles)].filter(
    (title) => !(title in formerTitles)
  )

  if (unlisted.length === 0) {
    return leadingElsewhere
  }

  const firstPageId = await firstPageIdOf(window)
  const batches = chunked({ items: unlisted, size: TITLES_PER_REQUEST })

  for (const batch of batches) {
    const youngRedirects = new Map<string, string[]>()
    let continuation: Record<string, string> = {}

    for (;;) {
      await wait(PACE_MS)

      const page = await askFrenchWikipedia({
        parameters: {
          prop: 'redirects',
          rdlimit: 'max',
          rdnamespace: '0',
          rdprop: 'pageid|title',
          redirects: '1',
          titles: batch.join('|'),
          ...continuation
        },
        schema: redirectsPageSchema
      })

      for (const { from, to } of page.query.redirects ?? []) {
        leadingElsewhere.set(from, to)
      }

      for (const { redirects = [], title } of page.query.pages) {
        const young = redirects
          .filter(({ pageid }) => pageid >= firstPageId)
          .map((redirect) => redirect.title)

        youngRedirects.set(title, [
          ...(youngRedirects.get(title) ?? []),
          ...young
        ])
      }

      if (page.continue === undefined) {
        break
      }

      continuation = page.continue
    }

    for (const [title, young] of youngRedirects) {
      const left: string[] = []

      for (const redirect of young) {
        await wait(PACE_MS)

        if (await wasMovedDuring({ title: redirect, window })) {
          left.push(redirect)
        }
      }

      formerTitles[title] = left
    }

    for (const title of batch) {
      formerTitles[title] ??= []
    }
  }

  return leadingElsewhere
}

/**
 * Each entity's current French title and the titles its article left during
 * the window. A title cached before a rename is a redirect now and is asked of
 * Wikidata again; one Wikidata still names is a sitelink made to a redirect on
 * purpose (_Rickon Stark_, filed in a list of characters) and is measured
 * alone, since the article it leads to is the list.
 */
const titlesAcrossTheWindowOf = async ({
  entityIds,
  label,
  window
}: {
  entityIds: readonly string[]
  label: string
  window: Window
}) => {
  const titles = await frenchTitlesOf({ entityIds, label })
  const cacheName = `frwiki-former-titles-${window.from}-${window.until}.json`
  const formerTitles = await readCachedEntries(cacheName, z.array(z.string()))
  const titlesOfEntities = () =>
    [...titles.values()].filter((title) => title !== null)

  const leadingElsewhere = await listFormerTitlesInto({
    formerTitles,
    titles: titlesOfEntities(),
    window
  })
  const renamed = [...titles]
    .filter(([, title]) => title !== null && leadingElsewhere.has(title))
    .map(([entityId]) => entityId)

  if (renamed.length > 0) {
    for (const [entityId, title] of await refreshedFrenchTitlesOf(renamed)) {
      titles.set(entityId, title)
    }

    await listFormerTitlesInto({
      formerTitles,
      titles: titlesOfEntities(),
      window
    })
  }

  await writeCachedEntries({ entries: formerTitles, name: cacheName })

  return { formerTitles, titles }
}

/** A month the endpoint left out is one nobody read, the article not yet written. */
const typicalYearOf = (months: readonly number[]): number => {
  const year = [
    ...months,
    ...Array.from({ length: MONTHS_READ - months.length }, () => 0)
  ].toSorted((a, b) => a - b)
  const middle = MONTHS_READ / 2
  const median = ((year[middle - 1] ?? 0) + (year[middle] ?? 0)) / 2

  return Math.round(median * MONTHS_READ)
}

const summedMonths = (series: readonly MonthlyViews[]): number[] => {
  const totals = new Map<string, number>()

  for (const months of series) {
    for (const [stamp, views] of Object.entries(months)) {
      totals.set(stamp, (totals.get(stamp) ?? 0) + views)
    }
  }

  return [...totals.values()]
}

/**
 * Each entity's French readers in a typical year of the twelve whole months
 * before `today` (`YYYY-MM-DD`), zero where it has no French article. An
 * article renamed during the year sums its months under every title it held:
 * the endpoint counts a title, not an article, and _Frodo Bessac_ read two
 * hundred a month while the article was still _Frodon Sacquet_. The months are
 * cached per window: a run that dies resumes, and a second build in the same
 * month asks nothing.
 */
export const frenchYearlyViewsOf = async ({
  entityIds,
  label,
  today
}: {
  entityIds: readonly string[]
  label: string
  today: string
}): Promise<Map<string, number>> => {
  const window = lastWholeYearBefore(today)
  const { formerTitles, titles } = await titlesAcrossTheWindowOf({
    entityIds,
    label,
    window
  })
  const titlesHeld = (title: string): string[] => [
    title,
    ...(formerTitles[title] ?? [])
  ]
  const cacheName = `frwiki-monthly-views-by-stamp-${window.from}-${window.until}.json`
  const months = await readCachedEntries(cacheName, monthlyViewsSchema)

  const wanted = [
    ...new Set(
      [...titles.values()].filter((title) => title !== null).flatMap(titlesHeld)
    )
  ].filter((title) => !(title in months))

  console.info(
    `  ${label}: ${wanted.length} articles left to measure from ${window.from} until ${window.until}`
  )

  for (const [index, title] of wanted.entries()) {
    await wait(PACE_MS)
    months[title] = await monthlyViewsOfTitle({ title, window })

    if (index % SAVE_EVERY === SAVE_EVERY - 1 || index === wanted.length - 1) {
      await writeCachedEntries({ entries: months, name: cacheName })
      console.info(`    monthly views ${index + 1}/${wanted.length}`)
    }
  }

  return new Map(
    [...titles].map(([entityId, title]) => [
      entityId,
      title === null
        ? 0
        : typicalYearOf(
            summedMonths(titlesHeld(title).map((held) => months[held] ?? {}))
          )
    ])
  )
}
