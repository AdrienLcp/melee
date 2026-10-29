import { z } from 'zod'

import { countryCodeSchema } from '@melee/protocol/country-code'
import {
  type QuestionLanguage,
  questionLanguages,
  silhouetteFileSchema
} from '@melee/protocol/question'

import {
  acceptedCountryNames,
  COUNTRY_NAMES_BY_LANGUAGE
} from './country-answers'
import type { BankedQuestion } from './question-bank'
import silhouetteBank from './silhouette-bank.json' with { type: 'json' }

/**
 * The silhouettes rubric, dealt from `silhouette-bank.json` like the flags
 * from theirs: `scripts/build-silhouette-bank.ts` drew each outline once from
 * the atlas, and the answer is the name the map already gives the country.
 */
const silhouetteBankSchema = z.array(
  z.object({
    code: countryCodeSchema,
    decoys: z.tuple([countryCodeSchema, countryCodeSchema, countryCodeSchema]),
    file: silhouetteFileSchema,
    isWellKnown: z.boolean()
  })
)

const PROMPT_BY_LANGUAGE = {
  en: 'Which country has this shape?',
  fr: 'Quel pays a cette forme ?'
} as const satisfies Record<QuestionLanguage, string>

let silhouetteQuestions: BankedQuestion[] | undefined

/** Every outline in both languages; the id is the file's, never the country's. */
export const bankedSilhouetteQuestions = (): BankedQuestion[] => {
  silhouetteQuestions ??= silhouetteBankSchema
    .parse(silhouetteBank)
    .flatMap((silhouette) =>
      questionLanguages.map((language) => {
        const names = COUNTRY_NAMES_BY_LANGUAGE[language]

        return {
          accepted: acceptedCountryNames({ code: silhouette.code, language }),
          answer: names[silhouette.code].name,
          category: 'silhouettes' as const,
          choiceOnly: false,
          decoys: [
            names[silhouette.decoys[0]].name,
            names[silhouette.decoys[1]].name,
            names[silhouette.decoys[2]].name
          ] as const,
          flag: null,
          id: `silhouette-${language}-${silhouette.file.replace('.svg', '')}`,
          isAdult: false,
          isWellKnown: silhouette.isWellKnown,
          language,
          note: null,
          prompt: PROMPT_BY_LANGUAGE[language],
          rebus: null,
          silhouette: silhouette.file,
          theme: 'natural-earth'
        }
      })
    )

  return silhouetteQuestions
}
