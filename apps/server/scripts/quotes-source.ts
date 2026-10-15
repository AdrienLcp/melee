import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import type { QuestionLanguage } from '@taverla/protocol/question'

import { orStop, readJsonFile } from './json-file'
import type { IngestedQuestions } from './question-source'

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * A line a table recognises — from a film, a series, a video game, an ad or a
 * real person — written here by hand: no open bank carries one with where it
 * comes from and three plausible others. Each language is its own list rather
 * than a translation, because the line a French table quotes is the dub's, and
 * a table in English quotes the original.
 */
const authoredQuoteSchema = z.object({
  accepted: z.array(z.string()),
  answer: z.string().min(1),
  decoys: z.tuple([z.string(), z.string(), z.string()]),
  id: z.string().regex(/^quote-(fr|en)-[a-z0-9-]+$/),
  isWellKnown: z.boolean(),
  kind: z.enum(['brand', 'film', 'game', 'person', 'series']),
  note: z.string().nullable(),
  prompt: z.string().min(1)
})

type QuoteKind = z.infer<typeof authoredQuoteSchema>['kind']

/**
 * What the room is asked to name, appended to the line. One chip holds works,
 * brands and people, so the answer changes nature from row to row, and a typed
 * answer has to know which it owes before the four candidates are there to say.
 */
const ASK_BY_KIND = {
  en: {
    brand: 'Which brand?',
    film: 'Which film?',
    game: 'Which video game?',
    person: 'Who said it?',
    series: 'Which series?'
  },
  fr: {
    brand: 'Quelle marque ?',
    film: 'Quel film ?',
    game: 'Quel jeu vidéo ?',
    person: 'Qui l’a dit ?',
    series: 'Quelle série ?'
  }
} as const satisfies Record<QuestionLanguage, Record<QuoteKind, string>>

const THEME_BY_LANGUAGE = {
  en: 'Quotes',
  fr: 'Citations'
} as const satisfies Record<QuestionLanguage, string>

export const ingestQuotes = (language: QuestionLanguage): IngestedQuestions => {
  const path = join(HERE, `quotes-${language}.json`)
  const quotes = orStop(
    readJsonFile(path, z.array(authoredQuoteSchema)),
    `quotes-${language}.json`
  )

  return {
    attribution: {
      author: 'Taverla',
      language,
      licence: 'CC BY-SA 4.0',
      source: 'Taverla',
      url: 'https://github.com/AdrienLcp/taverla'
    },
    questions: quotes.map(({ kind, prompt, ...quote }) => ({
      ...quote,
      category: 'quotes',
      choiceOnly: false,
      isAdult: false,
      language,
      prompt: `${prompt} ${ASK_BY_KIND[language][kind]}`,
      theme: THEME_BY_LANGUAGE[language]
    })),
    rejections: []
  }
}
