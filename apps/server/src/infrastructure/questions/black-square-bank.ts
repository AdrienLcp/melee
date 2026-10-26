import { z } from 'zod'

import { pickRandom } from '@melee/core/helpers/random'

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
  /** Its French Wikipedia article's sixty-day traffic, which ranks the nine. */
  views: z.number().int().nonnegative()
})

const blackSquareThemeSchema = z.object({
  /** The nine most read true answers, most read first. */
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

export type BlackSquareAnswer = z.infer<typeof blackSquareAnswerSchema>

export type BlackSquareTheme = z.infer<typeof blackSquareThemeSchema>

/** Parsed on the first draw, like the other banks, rather than on every cold start. */
let parsed: readonly BlackSquareTheme[] | null = null

export const bankedBlackSquareThemes = (): readonly BlackSquareTheme[] => {
  parsed ??= z.array(blackSquareThemeSchema).parse(bank)

  return parsed
}

export const playedBlackSquareThemeId = (id: string): string =>
  `blacksquare:${id}`

/** A theme the room has not been dealt, or `null` once the bank is spent. */
export const drawBlackSquareTheme = ({
  playedIds
}: {
  playedIds: ReadonlySet<string>
}): BlackSquareTheme | null =>
  pickRandom(
    bankedBlackSquareThemes().filter(
      ({ id }) => !playedIds.has(playedBlackSquareThemeId(id))
    )
  )
