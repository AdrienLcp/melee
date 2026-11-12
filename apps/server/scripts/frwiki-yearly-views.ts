import { z } from 'zod'

import { frenchTitlesOf } from './frwiki-notability'
import { readCachedEntries, writeCachedEntries } from './question-source'
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

const monthlyViewsSchema = z.object({
  items: z.array(z.object({ timestamp: z.string(), views: z.number() }))
})

/** What the endpoint's 404 means: an article never read, or none at all. */
const NO_FIGURE = JSON.stringify({ items: [] })

const stampOfMonth = (monthsSinceYearZero: number): string => {
  const year = Math.floor(monthsSinceYearZero / 12)
  const month = (monthsSinceYearZero % 12) + 1

  return `${year}${String(month).padStart(2, '0')}0100`
}

/**
 * The twelve months before the current one. The endpoint clips the last
 * bucket to the end stamp, so the request runs to the first of the current
 * month and that partial bucket is dropped. The window names the cache: a
 * figure compares only with one read over the same months, and the sixty-day
 * cache, keyed by title alone, kept October's numbers through a rebuild in
 * November.
 */
const lastWholeYearBefore = (today: string) => {
  const [year = 0, month = 1] = today.split('-').map(Number)
  const current = year * 12 + month - 1
  const from = stampOfMonth(current - MONTHS_READ)
  const until = stampOfMonth(current)

  return {
    cacheName: `frwiki-monthly-views-${from}-${until}.json`,
    from,
    until
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

const monthlyViewsOfTitle = async ({
  from,
  title,
  until
}: {
  from: string
  title: string
  until: string
}): Promise<number[]> => {
  const article = encodeURIComponent(title.replaceAll(' ', '_'))
  const { items } = await withRetries(monthlyViewsSchema, async () => {
    const response = await admittedFetch(
      `${PER_ARTICLE_URL}/${article}/monthly/${from}/${until}`
    )

    return response.status === 404 ? new Response(NO_FIGURE) : response
  })

  return items
    .filter(({ timestamp }) => timestamp < until)
    .map(({ views }) => views)
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

/**
 * Each entity's French readers in a typical year of the twelve whole months
 * before `today` (`YYYY-MM-DD`), zero where it has no French article. The
 * months are cached per window: a run that dies resumes, and a second build in
 * the same month asks nothing.
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
  const titles = await frenchTitlesOf({ entityIds, label })
  const { cacheName, from, until } = lastWholeYearBefore(today)
  const months = await readCachedEntries(cacheName, z.array(z.number()))

  const wanted = [
    ...new Set([...titles.values()].filter((title) => title !== null))
  ].filter((title) => !(title in months))

  console.info(
    `  ${label}: ${wanted.length} articles left to measure from ${from} until ${until}`
  )

  for (const [index, title] of wanted.entries()) {
    await wait(PACE_MS)
    months[title] = await monthlyViewsOfTitle({ from, title, until })

    if (index % SAVE_EVERY === SAVE_EVERY - 1 || index === wanted.length - 1) {
      await writeCachedEntries({ entries: months, name: cacheName })
      console.info(`    monthly views ${index + 1}/${wanted.length}`)
    }
  }

  return new Map(
    [...titles].map(([entityId, title]) => [
      entityId,
      title === null ? 0 : typicalYearOf(months[title] ?? [])
    ])
  )
}
