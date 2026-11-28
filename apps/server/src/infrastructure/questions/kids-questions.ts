import { z } from 'zod'

import {
  type QuestionLanguage,
  questionLanguages,
  writtenInOneLanguage
} from '@melee/protocol/question'

import { contentTiers } from '@melee/core/round/difficulty-draw'

import kidsEn from './kids-en.json' with { type: 'json' }
import kidsFr from './kids-fr.json' with { type: 'json' }
import kidsPt from './kids-pt.json' with { type: 'json' }
import type { BankedQuestion } from './question-bank'

/**
 * The kids' rubric: a question a ten-year-old answers and the adults beside
 * them still enjoy — animals, cartoons, fairy tales, the body, the sky, sport
 * and food. Written by hand, because the bank's `easy` means a subject the
 * room has heard of, which deals a third president of the United States to a
 * child. One list translated into each language, since none of it belongs to
 * one country; dealt beside the bank like the rebus.
 */
export const authoredKidsQuestionSchema = z.object({
  accepted: z.array(z.string()),
  answer: z.string().min(1),
  choiceOnly: z.boolean(),
  decoys: z.tuple([z.string(), z.string(), z.string()]),
  id: z.string().regex(/^kids-(en|fr|pt)-[a-z0-9-]+$/),
  note: z.string().nullable(),
  prompt: z.string().min(1),
  tier: z.enum(contentTiers)
})

export const AUTHORED_KIDS_QUESTIONS = {
  en: kidsEn,
  fr: kidsFr,
  pt: kidsPt
} as const satisfies Record<QuestionLanguage, unknown>

let kidsQuestions: BankedQuestion[] | undefined

export const bankedKidsQuestions = (): BankedQuestion[] => {
  kidsQuestions ??= questionLanguages.flatMap((language) =>
    z
      .array(authoredKidsQuestionSchema)
      .parse(AUTHORED_KIDS_QUESTIONS[language])
      .map((row) => ({
        ...row,
        ...writtenInOneLanguage(row),
        category: 'kids' as const,
        easyDecoys: null,
        flag: null,
        isAdult: false,
        isWellKnown: row.tier === 'easy',
        language,
        rebus: null,
        silhouette: null,
        theme: 'melee-kids'
      }))
  )

  return kidsQuestions
}
