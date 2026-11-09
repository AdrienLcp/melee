import { z } from 'zod'

import type { Difficulty } from '@melee/protocol/difficulty'

import {
  type ContentTier,
  contentTiers,
  drawByDifficulty
} from '@melee/core/round/difficulty-draw'

import culture from './black-square-authored-culture.json' with { type: 'json' }
import food from './black-square-authored-food.json' with { type: 'json' }
import home from './black-square-authored-home.json' with { type: 'json' }
import nature from './black-square-authored-nature.json' with { type: 'json' }
import pilots from './black-square-authored-pilots.json' with { type: 'json' }
import bank from './black-square-bank.json' with { type: 'json' }

const bilingualSchema = z.object({ en: z.string(), fr: z.string() })

const namedEntitySchema = z.object({
  /** Every other name Wikidata holds for it, per language. */
  aliases: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
  /** Its Wikidata identifier, unique within a theme. */
  id: z.string(),
  labels: bilingualSchema
})

const blackSquareAnswerSchema = namedEntitySchema.extend({
  /**
   * The series or franchise it stands for, `null` when it stands alone. A
   * theme banks one answer per franchise, so no two of its answers share one.
   */
  series: z.string().nullable(),
  /** Its French Wikipedia article's sixty-day traffic, which ranks the nine and tiers them. */
  views: z.number().int().nonnegative()
})

const blackSquareThemeSchema = z.object({
  /** The nine most read true answers, one per franchise, most read first. */
  answers: z.array(blackSquareAnswerSchema).length(9),
  /** An answer that sounds right and is not; landing on it voids the round. */
  blackWord: namedEntitySchema.extend({
    /** Why it is wrong, one line for the reveal. */
    why: bilingualSchema
  }),
  /** `template:subject[:neighbour]`, as the build script declared it. */
  id: z.string(),
  /** The theme as the wall shows it. */
  labels: bilingualSchema
})

const tierSchema = z.enum(contentTiers)

const authoredBilingualSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1)
})

const aliasesSchema = z.object({
  en: z.array(z.string().min(1)),
  fr: z.array(z.string().min(1))
})

/**
 * A theme written by hand: broad, so a table says plenty before it lands on the
 * cells dealt, and pooled wide enough that a theme dealt again hides other
 * answers.
 */
const authoredThemeSchema = z.object({
  answers: z
    .array(
      z.object({
        /** Every other name a table may type for it, per language. */
        aliases: aliasesSchema,
        labels: authoredBilingualSchema,
        tier: tierSchema
      })
    )
    .min(12)
    .max(20),
  blackWord: z.object({
    aliases: aliasesSchema,
    labels: authoredBilingualSchema,
    why: authoredBilingualSchema
  }),
  /** Kebab-case, unique across both banks: a Wikidata id always holds a colon. */
  id: z.string().regex(/^[a-z]+(-[a-z]+)*$/),
  labels: authoredBilingualSchema,
  tier: tierSchema
})

export type BlackSquareAnswer = z.infer<typeof blackSquareAnswerSchema>

export type BlackSquareTheme = z.infer<typeof blackSquareThemeSchema>

/** A theme as a round deals from it, whichever bank it came from. */
export type PooledBlackSquareTheme = z.infer<typeof authoredThemeSchema>

/** Parsed on the first draw, like the other banks, rather than on every cold start. */
let parsed: readonly BlackSquareTheme[] | null = null
let parsedAuthored: readonly PooledBlackSquareTheme[] | null = null
let pooled: readonly PooledBlackSquareTheme[] | null = null

export const bankedBlackSquareThemes = (): readonly BlackSquareTheme[] => {
  parsed ??= z.array(blackSquareThemeSchema).parse(bank)

  return parsed
}

/** The hand-written themes, one file a domain so each can be authored and checked alone. */
export const authoredBlackSquareSources = {
  culture,
  food,
  home,
  nature,
  pilots
} as const satisfies Record<string, readonly unknown[]>

export const parseAuthoredBlackSquareThemes = (
  source: readonly unknown[]
): PooledBlackSquareTheme[] => z.array(authoredThemeSchema).parse(source)

export const authoredBlackSquareThemes =
  (): readonly PooledBlackSquareTheme[] => {
    parsedAuthored ??= Object.values(authoredBlackSquareSources).flatMap(
      parseAuthoredBlackSquareThemes
    )

    return parsedAuthored
  }

/** The thirds of a list ranked by traffic: the most read third obvious, the least read rare. */
const tierOfRank = (rank: number, count: number): ContentTier =>
  contentTiers[Math.floor((rank * contentTiers.length) / count)] ?? 'hard'

const totalViewsOf = ({ answers }: BlackSquareTheme): number =>
  answers.reduce((total, { views }) => total + views, 0)

const medianOf = (values: readonly number[]): number =>
  values.toSorted((left, right) => left - right)[
    Math.floor(values.length / 2)
  ] ?? 0

/**
 * A Wikidata theme is never `easy`: a list of works or office holders is a
 * closed set a table has to know, which a hand-written theme is not. The
 * better read half is `medium`, the rest `hard`.
 */
const pooledFromWikidata = (
  themes: readonly BlackSquareTheme[]
): PooledBlackSquareTheme[] => {
  const medianViews = medianOf(themes.map(totalViewsOf))

  return themes.map((theme) => ({
    answers: theme.answers.map(({ aliases, labels }, rank) => ({
      aliases,
      labels,
      tier: tierOfRank(rank, theme.answers.length)
    })),
    blackWord: {
      aliases: theme.blackWord.aliases,
      labels: theme.blackWord.labels,
      why: theme.blackWord.why
    },
    id: theme.id,
    labels: theme.labels,
    tier: totalViewsOf(theme) >= medianViews ? 'medium' : 'hard'
  }))
}

/** Every theme a round may be dealt, each answer and each theme tiered. */
export const blackSquareThemePool = (): readonly PooledBlackSquareTheme[] => {
  pooled ??= [
    ...authoredBlackSquareThemes(),
    ...pooledFromWikidata(bankedBlackSquareThemes())
  ]

  return pooled
}

export const playedBlackSquareThemeId = (id: string): string =>
  `blacksquare:${id}`

/** A theme at the room's level the room has not been dealt, or `null` once the bank is spent. */
export const drawBlackSquareTheme = ({
  difficulty,
  playedIds
}: {
  difficulty: Difficulty
  playedIds: ReadonlySet<string>
}): PooledBlackSquareTheme | null =>
  drawByDifficulty({
    difficulty,
    pool: blackSquareThemePool().filter(
      ({ id }) => !playedIds.has(playedBlackSquareThemeId(id))
    ),
    tierOf: ({ tier }) => tier
  })
