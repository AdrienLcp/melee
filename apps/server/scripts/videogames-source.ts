import { z } from 'zod'

import { readAuthoredList, taverlaAttribution } from './authored-questions'
import type { IngestedQuestions } from './question-source'

/**
 * A French video-game question written here by hand, because the open banks
 * ask one thing about video games — who developed it — and an evening of that
 * is one question. `shape` is what the row asks about, kept so the spread
 * across shapes can be read off the file rather than guessed.
 */
const authoredVideoGameSchema = z.object({
  accepted: z.array(z.string()),
  answer: z.string().min(1),
  choiceOnly: z.boolean().default(false),
  decoys: z.tuple([z.string(), z.string(), z.string()]),
  id: z.string().regex(/^videogames-fr-[a-z0-9-]+$/),
  isWellKnown: z.boolean(),
  note: z.string().nullable(),
  prompt: z.string().min(1).max(160),
  shape: z.enum([
    'character',
    'culture',
    'era',
    'franchise',
    'hardware',
    'mechanic',
    'music',
    'place',
    'studio',
    'vocabulary'
  ])
})

export const ingestVideoGames = (): IngestedQuestions => {
  const questions = readAuthoredList({
    fileName: 'videogames-fr.json',
    schema: authoredVideoGameSchema
  })

  return {
    attribution: taverlaAttribution('fr'),
    questions: questions.map(({ shape, ...question }) => ({
      ...question,
      category: 'videogames',
      isAdult: false,
      language: 'fr',
      theme: `videogames/authored/${shape}`
    })),
    rejections: []
  }
}
