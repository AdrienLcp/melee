import { z } from 'zod'

import { questionCategorySchema } from '@melee/protocol/question'

import { meleeAttribution, readAuthoredList } from './authored-questions'
import type { Attribution, BankedQuestion } from './question-source'

/**
 * The Portuguese bank, written in this directory: the international rows of
 * the French and English banks translated into European Portuguese, and the
 * questions about Portugal a translated bank would never ask. No open trivia
 * set is written in pt-PT — Mintaka's Portuguese is Brazil's, and its rows are
 * already here through their French half — so translating what this bank
 * already trusts beats adapting a corpus nobody read.
 *
 * A translated row keeps the id of the row it came from in `from`, so its
 * credit follows it; a row about Portugal holds `null` and is this
 * repository's own.
 */
const portugueseRowSchema = z.object({
  accepted: z.array(z.string().min(1)),
  answer: z.string().min(1),
  category: questionCategorySchema,
  choiceOnly: z.boolean(),
  decoys: z.tuple([z.string(), z.string(), z.string()]),
  from: z.string().nullable(),
  id: z.string().regex(/^pt-[a-z0-9-]+$/),
  isWellKnown: z.boolean(),
  note: z.string().nullable(),
  prompt: z.string().min(1),
  theme: z.string()
})

/**
 * The source each translated row's id names, by the prefix every source mints.
 * A row whose source is not here was written by this repository — a quote, a
 * video game question, or one about Portugal.
 */
export type TranslatedSources = Partial<Record<string, Attribution>>

const sourcePrefixOf = (id: string): string => id.split('-')[0] ?? id

const translated = (attribution: Attribution): Attribution => ({
  ...attribution,
  author: `${attribution.author}, translated into European Portuguese by Melee`,
  language: 'pt'
})

export const ingestPortuguese = (
  sources: TranslatedSources
): { attributions: Attribution[]; questions: BankedQuestion[] } => {
  const rows = readAuthoredList({
    fileName: 'questions-pt.json',
    schema: portugueseRowSchema
  })
  const credited = new Set(
    rows.flatMap(({ from }) =>
      from === null ? [] : [sources[sourcePrefixOf(from)]]
    )
  )

  return {
    attributions: [
      ...[...credited]
        .filter((attribution) => attribution !== undefined)
        .map(translated),
      meleeAttribution('pt')
    ],
    questions: rows.map(({ from: _from, ...row }) => ({
      ...row,
      isAdult: false,
      language: 'pt'
    }))
  }
}
