import { z } from 'zod'

import bank from './guess-nine-bank.json' with { type: 'json' }

const bilingualSchema = z.object({ en: z.string(), fr: z.string() })

const namedEntitySchema = z.object({
  /** Every other name Wikidata holds for it, per language. */
  aliases: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
  /** Its Wikidata identifier, unique within a theme. */
  id: z.string(),
  labels: bilingualSchema
})

const guessNineAnswerSchema = namedEntitySchema.extend({
  /** Its French Wikipedia article's sixty-day traffic, which ranks the nine. */
  views: z.number().int().nonnegative()
})

const guessNineThemeSchema = z.object({
  /** The nine most read true answers, most read first. */
  answers: z.array(guessNineAnswerSchema).length(9),
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

export type GuessNineAnswer = z.infer<typeof guessNineAnswerSchema>

export type GuessNineTheme = z.infer<typeof guessNineThemeSchema>

/** Parsed on the first draw, like the other banks, rather than on every cold start. */
let parsed: readonly GuessNineTheme[] | null = null

export const bankedGuessNineThemes = (): readonly GuessNineTheme[] => {
  parsed ??= z.array(guessNineThemeSchema).parse(bank)

  return parsed
}
