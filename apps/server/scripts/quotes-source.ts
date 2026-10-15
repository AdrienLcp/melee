import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import type { QuestionLanguage } from '@taverla/protocol/question'

import { orStop, readJsonFile } from './json-file'
import type { IngestedQuestions } from './question-source'

const HERE = dirname(fileURLToPath(import.meta.url))

/**
 * A line from a film or a series, written here by hand: no open bank carries
 * one with its source and three works it could plausibly have come from. Each
 * language is its own list rather than a translation, because the line a French
 * table quotes is the dub's, and a table in English quotes the original.
 */
const authoredQuoteSchema = z.object({
  accepted: z.array(z.string()),
  answer: z.string().min(1),
  decoys: z.tuple([z.string(), z.string(), z.string()]),
  id: z.string().regex(/^quote-(fr|en)-[a-z0-9-]+$/),
  isWellKnown: z.boolean(),
  note: z.string().nullable(),
  prompt: z.string().min(1)
})

const THEME_BY_LANGUAGE = {
  en: 'Quotes',
  fr: 'Répliques'
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
    questions: quotes.map((quote) => ({
      ...quote,
      category: 'quotes',
      choiceOnly: false,
      isAdult: false,
      language,
      theme: THEME_BY_LANGUAGE[language]
    })),
    rejections: []
  }
}
