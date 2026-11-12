import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import {
  franchiseStemOf,
  isFranchiseBase,
  isTitleWithin
} from '@melee/core/blacksquare/franchise-stem'
import { normalizeAnswer } from '@melee/core/round/answer-matching'
import { contentTiers } from '@melee/core/round/difficulty-draw'

import { nowMs } from '../src/infrastructure/clock'
import { LEAST_POOLED_ANSWERS, spreadAnswers } from './answer-spread'
import {
  TEMPLATES,
  type TemplateName,
  type Wording
} from './black-square-templates'
import {
  BLACK_SQUARE_THEMES,
  SHOWN_LABELS,
  SPOKEN_ALIASES,
  type ThemeSpec,
  UMBRELLA_SERIES
} from './black-square-themes'
import { frenchViewsOf } from './frwiki-notability'
import { frenchYearlyViewsOf } from './frwiki-yearly-views'
import { jsonOf, orStop, parseJson } from './json-file'
import { cached } from './question-source'
import { aliasesOf } from './wikidata-aliases'
import { type SeriesFacts, seriesFactsOf } from './wikidata-series'
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
  '../src/infrastructure/questions/black-square-bank.json'
)

/**
 * An answer or a black word is only worth its cell if a table could have heard
 * of it, and an entity with an article in a handful of Wikipedias is not one.
 * The cut also keeps a movement's thousand paintings out of the traffic lookup.
 */
const LEAST_SITELINKS = 5

type Entity = { id: string; labels: Wording; sitelinks: number }

/** The templates whose answers are works, which is what has sequels. */
const WORK_TEMPLATES: ReadonlySet<TemplateName> = new Set([
  'albums-by-band',
  'award-winning-films',
  'books-by-author',
  'films-directed-by',
  'films-of-studio'
])

/** A film Wikidata gives no release date is one still being made. */
const FILM_TEMPLATES: ReadonlySet<TemplateName> = new Set([
  'award-winning-films',
  'films-directed-by',
  'films-of-studio'
])

/**
 * Where a title running inside another's is a sequel. On an album it is the
 * band's own name: *The Beatles* is inside *Beatles for Sale*.
 */
const TITLED_SEQUEL_TEMPLATES: ReadonlySet<TemplateName> = new Set([
  ...FILM_TEMPLATES,
  'books-by-author'
])

/** `YYYY-MM-DD`, comparable as text with Wikidata's own stamps. */
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(
  nowMs()
)

const isReleased = ({
  facts,
  template
}: {
  facts: SeriesFacts | undefined
  template: TemplateName
}): boolean => {
  const releasedOn = facts?.releasedOn ?? null

  return releasedOn === null
    ? !FILM_TEMPLATES.has(template)
    : releasedOn <= TODAY
}

const isEitherTitleWithin = ({ a, b }: { a: Entity; b: Entity }): boolean =>
  (['en', 'fr'] as const).some(
    (language) =>
      isTitleWithin({
        title: a.labels[language],
        within: b.labels[language]
      }) ||
      isTitleWithin({ title: b.labels[language], within: a.labels[language] })
  )

type Franchise = { members: Entity[]; series: string | null }

/**
 * The truths, most read first, gathered into franchises: works sharing a
 * series — or a truth that is itself the series, *Sunflowers* beside its
 * versions —, whose titles share a stem, one of whose titles runs inside
 * the other's, or that the theme's `sameThing` names together. A series in
 * `UMBRELLA_SERIES` names the subject's whole output rather than a franchise
 * inside it, and links nothing.
 */
const franchisesOf = ({
  factsOf,
  sameThing,
  template,
  truths
}: {
  factsOf: (entity: Entity) => SeriesFacts | undefined
  sameThing: readonly (readonly string[])[]
  template: TemplateName
  truths: readonly Entity[]
}): Franchise[] => {
  const parents = truths.map((_, index) => index)
  const rootOf = (index: number): number => {
    const parent = parents[index] ?? index

    return parent === index ? index : rootOf(parent)
  }
  const join = ({ from, to }: { from: number; to: number }) => {
    const [kept, merged] = [rootOf(from), rootOf(to)].toSorted((a, b) => a - b)

    if (kept !== undefined && merged !== undefined) {
      parents[merged] = kept
    }
  }
  const firstHolder = new Map<string, number>()
  const linkBy = ({ index, key }: { index: number; key: string }) => {
    const holder = firstHolder.get(key)

    if (holder === undefined) {
      firstHolder.set(key, index)
    } else {
      join({ from: holder, to: index })
    }
  }
  const seriesOf = (entity: Entity): string[] =>
    (factsOf(entity)?.belongsTo ?? []).filter(
      (series) => !UMBRELLA_SERIES.has(series)
    )

  for (const [index, truth] of truths.entries()) {
    if (!UMBRELLA_SERIES.has(truth.id)) {
      linkBy({ index, key: `series:${truth.id}` })
    }

    for (const series of seriesOf(truth)) {
      linkBy({ index, key: `series:${series}` })
    }

    for (const [group, ids] of sameThing.entries()) {
      if (ids.includes(truth.id)) {
        linkBy({ index, key: `same:${group}` })
      }
    }

    if (WORK_TEMPLATES.has(template)) {
      for (const label of [truth.labels.en, truth.labels.fr]) {
        linkBy({ index, key: `stem:${franchiseStemOf(label)}` })
      }

      for (const [earlier, other] of TITLED_SEQUEL_TEMPLATES.has(template)
        ? truths.slice(0, index).entries()
        : []) {
        if (isEitherTitleWithin({ a: truth, b: other })) {
          join({ from: earlier, to: index })
        }
      }
    }
  }

  const franchises = new Map<number, Entity[]>()

  for (const [index, truth] of truths.entries()) {
    const root = rootOf(index)

    franchises.set(root, [...(franchises.get(root) ?? []), truth])
  }

  return [...franchises.values()].map((members) => {
    const counted = members.flatMap(seriesOf)
    const [shared] = counted
      .filter(
        (series) => counted.indexOf(series) !== counted.lastIndexOf(series)
      )
      .toSorted()
    const [first] = members

    return {
      members,
      series: shared ?? (members.length > 1 ? (first?.id ?? null) : null)
    }
  })
}

/** A franchise's own name over a sequel more read than it: *Shrek*, not *Shrek 2*. */
const representativeOf = ({ members }: Franchise): Entity | undefined =>
  members.find(
    ({ labels }) => isFranchiseBase(labels.en) || isFranchiseBase(labels.fr)
  ) ?? members[0]

const labelledBindingsSchema = sparqlBindingsSchema({
  en: bindingValue.optional(),
  fr: bindingValue.optional(),
  item: bindingValue,
  links: bindingValue.optional()
})

const entityIdOf = (uri: string): string => uri.split('/').at(-1) ?? uri

const labelledEntitiesOf = (
  body: z.infer<typeof labelledBindingsSchema>
): Entity[] => {
  const entities = new Map<string, Entity>()

  for (const { en, fr, item, links } of body.results.bindings) {
    const id = entityIdOf(item.value)

    if (en !== undefined && fr !== undefined && !entities.has(id)) {
      entities.set(id, {
        id,
        labels: SHOWN_LABELS[id] ?? { en: en.value, fr: fr.value },
        sitelinks: Number(links?.value ?? 0)
      })
    }
  }

  return [...entities.values()]
}

/**
 * Every entity the pattern binds to `?item`, kept only when it is named in both
 * languages: an answer a French table cannot be shown in French is not one.
 * Cached under the query's own hash, so a template edited is a query asked
 * again and nothing else is.
 */
const entitiesMatching = async (pattern: string): Promise<Entity[]> => {
  const query = [
    'SELECT DISTINCT ?item ?en ?fr ?links WHERE {',
    `  { ${pattern} }`,
    '  OPTIONAL { ?item wikibase:sitelinks ?links }',
    '  OPTIONAL { ?item rdfs:label ?enLabel FILTER(lang(?enLabel) = "en") }',
    '  OPTIONAL { ?item rdfs:label ?frLabel FILTER(lang(?frLabel) = "fr") }',
    '  OPTIONAL { ?item rdfs:label ?mulLabel FILTER(lang(?mulLabel) = "mul") }',
    '  BIND(COALESCE(?enLabel, ?mulLabel) AS ?en)',
    '  BIND(COALESCE(?frLabel, ?mulLabel) AS ?fr)',
    '}'
  ].join('\n')
  const hash = createHash('sha1').update(query).digest('hex').slice(0, 16)

  const text = await cached(`black-square-${hash}.json`, async () => {
    const body = await withRetries(labelledBindingsSchema, async () =>
      fetch(SPARQL_URL, {
        body: new URLSearchParams({ query }),
        headers: {
          accept: 'application/sparql-results+json',
          'user-agent': USER_AGENT
        },
        method: 'POST'
      })
    )

    return JSON.stringify(body)
  })

  return labelledEntitiesOf(
    orStop(parseJson(text, labelledBindingsSchema), hash)
  )
}

const subjectLabelsOf = async (subject: string): Promise<Wording> => {
  const [entity] = await entitiesMatching(`VALUES ?item { wd:${subject} }`)

  if (entity === undefined) {
    throw new Error(`${subject} is not named in both languages`)
  }

  return entity.labels
}

type ThemeEntities = {
  candidates: Entity[]
  spec: ThemeSpec
  truths: Entity[]
  wording: Wording
}

const themeIdOf = ({ neighbour, subject, template }: ThemeSpec): string =>
  [template, subject, neighbour].filter((part) => part !== undefined).join(':')

const entitiesOf = async (spec: ThemeSpec): Promise<ThemeEntities> => {
  const template = TEMPLATES[spec.template]
  const query = {
    countries: spec.countries ?? null,
    neighbour: spec.neighbour ?? null,
    subject: spec.subject
  }

  if (template.needsNeighbour && spec.neighbour === undefined) {
    throw new Error(`${themeIdOf(spec)} needs a neighbour`)
  }

  const truths = await entitiesMatching(template.truths(query))
  const neighbours = (
    await entitiesMatching(template.candidates(query))
  ).filter(({ sitelinks }) => sitelinks >= LEAST_SITELINKS)
  const chosen = spec.blackWord
  const candidates =
    chosen === undefined || neighbours.some(({ id }) => id === chosen)
      ? neighbours
      : [
          ...neighbours,
          ...(await entitiesMatching(`VALUES ?item { wd:${chosen} }`))
        ]

  return {
    candidates,
    spec,
    truths,
    wording: spec.labels ?? template.label(await subjectLabelsOf(spec.subject))
  }
}

/** A name a typed line can match: Greece's 🇬🇷 alias normalises to nothing. */
const isTypeable = (name: string): boolean => normalizeAnswer(name) !== ''

const namesOf = ({
  aliases,
  labels
}: {
  aliases: { en: string[]; fr: string[] }
  labels: Wording
}): string[] =>
  [labels.en, labels.fr, ...aliases.en, ...aliases.fr].map(normalizeAnswer)

/**
 * A nickname two answers share names neither, and a round dealing one would
 * pay the other: *The Blues* is Chelsea and Manchester City, *RU* Russia and
 * the *Royaume-Uni*. Nor is it the black word's.
 *
 * A black word may share a nickname with a true answer — *The Amazing
 * Spider-Man* is also called *Spider-Man* — and that name has to stay a hit.
 */
const aliasesOutside = ({
  aliases,
  names
}: {
  aliases: { en: string[]; fr: string[] }
  names: ReadonlySet<string>
}) => ({
  en: aliases.en.filter((alias) => !names.has(normalizeAnswer(alias))),
  fr: aliases.fr.filter((alias) => !names.has(normalizeAnswer(alias)))
})

const bankedRowSchema = z.object({
  answers: z.array(
    z.object({
      aliases: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
      id: z.string(),
      labels: z.object({ en: z.string(), fr: z.string() }),
      series: z.string().nullable(),
      tier: z.enum(contentTiers),
      views: z.number()
    })
  ),
  blackWord: z.object({
    aliases: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
    id: z.string(),
    labels: z.object({ en: z.string(), fr: z.string() }),
    why: z.object({ en: z.string(), fr: z.string() })
  }),
  id: z.string(),
  labels: z.object({ en: z.string(), fr: z.string() })
})

type BankedRow = z.infer<typeof bankedRowSchema>

const build = async (): Promise<void> => {
  const themes: ThemeEntities[] = []

  for (const [index, spec] of BLACK_SQUARE_THEMES.entries()) {
    themes.push(await entitiesOf(spec))
    console.info(`  queried ${index + 1}/${BLACK_SQUARE_THEMES.length}`)
  }

  const entityIds = themes.flatMap(({ candidates, truths }) =>
    [...truths, ...candidates].map(({ id }) => id)
  )
  const everyTruthId = themes.flatMap(({ truths }) =>
    truths.map(({ id }) => id)
  )
  const yearlyViews = await frenchYearlyViewsOf({
    entityIds: everyTruthId,
    label: 'black square truths',
    today: TODAY
  })
  const viewsOf = (entity: Entity): number => yearlyViews.get(entity.id) ?? 0
  const byViews = (entities: readonly Entity[]): Entity[] =>
    entities.toSorted((a, b) => viewsOf(b) - viewsOf(a))
  const recentViews = await frenchViewsOf({
    entityIds,
    label: 'black square'
  })
  const recentViewsOf = (entity: Entity): number =>
    recentViews.get(entity.id) ?? 0
  const byRecentViews = (entities: readonly Entity[]): Entity[] =>
    entities.toSorted((a, b) => recentViewsOf(b) - recentViewsOf(a))

  const aliases = {
    en: await aliasesOf({ entityIds, language: 'en' }),
    fr: await aliasesOf({ entityIds, language: 'fr' })
  }
  const aliasesOfEntity = ({ id }: Entity) => ({
    en: (aliases.en.get(id) ?? []).filter(isTypeable),
    fr: [...(aliases.fr.get(id) ?? []), ...(SPOKEN_ALIASES[id] ?? [])].filter(
      isTypeable
    )
  })

  const facts = await seriesFactsOf({ entityIds: everyTruthId })
  const factsOf = ({ id }: Entity) => facts.get(id)

  const rows: BankedRow[] = []
  const dropped: string[] = []

  for (const { candidates, spec, truths, wording } of themes) {
    const id = themeIdOf(spec)
    const seen = new Set<string>()
    const released = byViews(truths).filter((truth) => {
      const label = normalizeAnswer(truth.labels.fr)
      const isFirstOfItsName = !seen.has(label)

      seen.add(label)

      return (
        isFirstOfItsName &&
        isReleased({ facts: factsOf(truth), template: spec.template })
      )
    })
    const franchises = franchisesOf({
      factsOf,
      sameThing: spec.sameThing ?? [],
      template: spec.template,
      truths: released
    })
    const chosen = franchises.flatMap((franchise) => {
      const answer = representativeOf(franchise)

      return answer === undefined || answer.sitelinks < LEAST_SITELINKS
        ? []
        : [{ answer, series: franchise.series }]
    })
    const spread = spreadAnswers({
      ranked: byViews(chosen.map(({ answer }) => answer)),
      viewsOf
    })
    const answers = spread.map(({ answer }) => answer)
    const pooledIds = new Set(answers.map(({ id: answerId }) => answerId))
    const seriesOfAnswer = new Map(
      chosen.map(({ answer, series }) => [answer.id, series])
    )

    for (const { members } of franchises) {
      if (
        members.length > 1 &&
        members.some(({ id: memberId }) => pooledIds.has(memberId))
      ) {
        console.info(
          `    franchise: ${members.map((member) => `${member.labels.fr} ${member.id} ${viewsOf(member)}`).join(' | ')}`
        )
      }
    }

    const trueNames = new Set(
      truths.flatMap((truth) =>
        namesOf({ aliases: aliasesOfEntity(truth), labels: truth.labels })
      )
    )
    const truthIds = new Set(truths.map(({ id: truthId }) => truthId))
    const excluded = new Set(spec.excluded ?? [])
    const eligible = byRecentViews(candidates).filter(
      (candidate) =>
        !truthIds.has(candidate.id) &&
        !excluded.has(candidate.id) &&
        !namesOf({
          aliases: aliasesOfEntity(candidate),
          labels: candidate.labels
        }).some((name) => trueNames.has(name))
    )
    const blackWord =
      spec.blackWord === undefined
        ? eligible[0]
        : candidates.find(
            ({ id: candidateId }) => candidateId === spec.blackWord
          )
    const review = eligible
      .slice(0, 5)
      .map(
        (candidate) =>
          `${candidate.labels.fr} ${candidate.id} ${recentViewsOf(candidate)}`
      )
      .join(' | ')

    console.info(
      `${id} [${wording.fr}] ${truths.length} true · black: ${blackWord?.labels.fr ?? '—'} ${blackWord?.id ?? ''} · ${review}`
    )
    console.info(
      `    pool: ${spread.map(({ answer, tier }) => `${answer.labels.fr} ${viewsOf(answer)} ${tier}`).join(' | ')}`
    )

    if (blackWord !== undefined && truthIds.has(blackWord.id)) {
      dropped.push(`${id}: black word ${blackWord.labels.fr} is a true answer`)
      continue
    }

    if (answers.length < LEAST_POOLED_ANSWERS) {
      dropped.push(`${id}: only ${answers.length} true answers`)
      continue
    }

    if (blackWord === undefined) {
      dropped.push(`${id}: no black word`)
      continue
    }

    if (spec.why === undefined) {
      dropped.push(`${id}: black word ${blackWord.labels.fr} not read yet`)
      continue
    }

    const namesOfAnswer = answers.map(
      (answer) =>
        new Set(
          namesOf({ aliases: aliasesOfEntity(answer), labels: answer.labels })
        )
    )

    rows.push({
      answers: spread.map(({ answer, tier }, index) => ({
        aliases: aliasesOutside({
          aliases: aliasesOfEntity(answer),
          names: new Set(
            namesOfAnswer.flatMap((names, other) =>
              other === index ? [] : [...names]
            )
          )
        }),
        id: answer.id,
        labels: answer.labels,
        series: seriesOfAnswer.get(answer.id) ?? null,
        tier,
        views: viewsOf(answer)
      })),
      blackWord: {
        aliases: aliasesOutside({
          aliases: aliasesOfEntity(blackWord),
          names: trueNames
        }),
        id: blackWord.id,
        labels: blackWord.labels,
        why: spec.why
      },
      id,
      labels: wording
    })
  }

  for (const reason of dropped) {
    console.warn(`  dropped ${reason}`)
  }

  const bank = jsonOf(z.array(bankedRowSchema)).parse(JSON.stringify(rows))

  await writeFile(BANK_PATH, `${JSON.stringify(bank, null, 2)}\n`, 'utf8')
  console.info(`${rows.length} themes banked, ${dropped.length} dropped`)
}

await build()
