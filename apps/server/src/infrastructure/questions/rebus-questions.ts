import { z } from 'zod'

import type { QuestionLanguage } from '@melee/protocol/question'

import type { BankedQuestion } from './question-bank'
import rebusEn from './rebus-en.json' with { type: 'json' }
import rebusFr from './rebus-fr.json' with { type: 'json' }

/**
 * The rebus rubric: a title written in emojis, the room names it. Written here
 * by hand, each language its own list rather than a translation, because a
 * French table reads *poser un lapin* where an English one reads *piece of
 * cake*. Dealt beside the bank like the flags, since the bank is rebuilt from a
 * dozen downloads and a rebus needs none of them.
 */
export const authoredRebusSchema = z.object({
  accepted: z.array(z.string()),
  answer: z.string().min(1),
  decoys: z.tuple([z.string(), z.string(), z.string()]),
  id: z.string().regex(/^rebus-(fr|en)-[a-z0-9-]+$/),
  isWellKnown: z.boolean(),
  kind: z.enum(['film', 'saying', 'series', 'song']),
  note: z.string().nullable(),
  rebus: z.string().min(1).max(64)
})

type RebusKind = z.infer<typeof authoredRebusSchema>['kind']

/**
 * What the room is asked to name. One chip holds films, songs and sayings, so a
 * typed answer has to know which it owes before four candidates say.
 */
const ASK_BY_KIND = {
  en: {
    film: 'Which film?',
    saying: 'Which saying?',
    series: 'Which series?',
    song: 'Which song?'
  },
  fr: {
    film: 'Quel film ?',
    saying: 'Quelle expression ?',
    series: 'Quelle série ?',
    song: 'Quelle chanson ?'
  }
} as const satisfies Record<QuestionLanguage, Record<RebusKind, string>>

export const AUTHORED_REBUSES = {
  en: rebusEn,
  fr: rebusFr
} as const satisfies Record<QuestionLanguage, unknown>

let rebusQuestions: BankedQuestion[] | undefined

export const bankedRebusQuestions = (): BankedQuestion[] => {
  rebusQuestions ??= (['en', 'fr'] as const).flatMap((language) =>
    z
      .array(authoredRebusSchema)
      .parse(AUTHORED_REBUSES[language])
      .map(({ kind, rebus, ...row }) => ({
        ...row,
        category: 'rebus' as const,
        choiceOnly: false,
        flag: null,
        isAdult: false,
        language,
        prompt: ASK_BY_KIND[language][kind],
        rebus,
        theme: 'melee-rebus'
      }))
  )

  return rebusQuestions
}
