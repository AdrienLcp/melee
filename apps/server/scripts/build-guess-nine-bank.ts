import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { normalizeAnswer } from '@melee/core/round/answer-matching'

import { frenchViewsOf } from './frwiki-notability'
import { TEMPLATES, type Wording } from './guess-nine-templates'
import {
  GUESS_NINE_THEMES,
  SPOKEN_ALIASES,
  type ThemeSpec
} from './guess-nine-themes'
import { jsonOf, orStop, parseJson } from './json-file'
import { cached } from './question-source'
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
  '../src/infrastructure/questions/guess-nine-bank.json'
)

const ANSWERS_PER_THEME = 9

/**
 * A black word is only worth its cell if a table could have heard of it, and a
 * neighbour with an article in a handful of Wikipedias is not one. The cut
 * also keeps a movement's thousand paintings out of the traffic lookup.
 */
const LEAST_CANDIDATE_SITELINKS = 5

type Entity = { id: string; labels: Wording; sitelinks: number }

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
        labels: { en: en.value, fr: fr.value },
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

  const text = await cached(`guess-nine-${hash}.json`, async () => {
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
  const query = { neighbour: spec.neighbour ?? null, subject: spec.subject }

  if (template.needsNeighbour && spec.neighbour === undefined) {
    throw new Error(`${themeIdOf(spec)} needs a neighbour`)
  }

  const truths = await entitiesMatching(template.truths(query))
  const neighbours = (
    await entitiesMatching(template.candidates(query))
  ).filter(({ sitelinks }) => sitelinks >= LEAST_CANDIDATE_SITELINKS)
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

const namesOf = ({
  aliases,
  labels
}: {
  aliases: { en: string[]; fr: string[] }
  labels: Wording
}): string[] =>
  [labels.en, labels.fr, ...aliases.en, ...aliases.fr].map(normalizeAnswer)

/**
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

  for (const [index, spec] of GUESS_NINE_THEMES.entries()) {
    themes.push(await entitiesOf(spec))
    console.info(`  queried ${index + 1}/${GUESS_NINE_THEMES.length}`)
  }

  const entityIds = themes.flatMap(({ candidates, truths }) =>
    [...truths, ...candidates].map(({ id }) => id)
  )
  const views = await frenchViewsOf({ entityIds, label: 'guess nine' })
  const viewsOf = (entity: Entity): number => views.get(entity.id) ?? 0
  const byViews = (entities: readonly Entity[]): Entity[] =>
    entities.toSorted((a, b) => viewsOf(b) - viewsOf(a))

  const aliases = {
    en: await aliasesOf({ entityIds, language: 'en' }),
    fr: await aliasesOf({ entityIds, language: 'fr' })
  }
  const aliasesOfEntity = ({ id }: Entity) => ({
    en: aliases.en.get(id) ?? [],
    fr: [...(aliases.fr.get(id) ?? []), ...(SPOKEN_ALIASES[id] ?? [])]
  })

  const rows: BankedRow[] = []
  const dropped: string[] = []

  for (const { candidates, spec, truths, wording } of themes) {
    const id = themeIdOf(spec)
    const answers: Entity[] = []
    const seen = new Set<string>()

    for (const truth of byViews(truths)) {
      const label = normalizeAnswer(truth.labels.fr)

      if (!seen.has(label) && answers.length < ANSWERS_PER_THEME) {
        seen.add(label)
        answers.push(truth)
      }
    }

    const trueNames = new Set(
      truths.flatMap((truth) =>
        namesOf({ aliases: aliasesOfEntity(truth), labels: truth.labels })
      )
    )
    const truthIds = new Set(truths.map(({ id: truthId }) => truthId))
    const excluded = new Set(spec.excluded ?? [])
    const eligible = byViews(candidates).filter(
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
          `${candidate.labels.fr} ${candidate.id} ${viewsOf(candidate)}`
      )
      .join(' | ')

    console.info(
      `${id} [${wording.fr}] ${truths.length} true · black: ${blackWord?.labels.fr ?? '—'} ${blackWord?.id ?? ''} · ${review}`
    )
    console.info(
      `    nine: ${answers.map((answer) => `${answer.labels.fr} ${viewsOf(answer)}`).join(' | ')}`
    )

    if (blackWord !== undefined && truthIds.has(blackWord.id)) {
      dropped.push(`${id}: black word ${blackWord.labels.fr} is a true answer`)
      continue
    }

    if (answers.length < ANSWERS_PER_THEME) {
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

    rows.push({
      answers: answers.map((answer) => ({
        aliases: aliasesOfEntity(answer),
        id: answer.id,
        labels: answer.labels,
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
