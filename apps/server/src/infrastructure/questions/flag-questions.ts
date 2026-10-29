import { z } from 'zod'

import { countryCodeSchema } from '@melee/protocol/country-code'
import {
  flagFileSchema,
  type QuestionLanguage,
  questionLanguages
} from '@melee/protocol/question'

import {
  acceptedCountryNames,
  COUNTRY_NAMES_BY_LANGUAGE
} from './country-answers'
import flagBank from './flag-bank.json' with { type: 'json' }
import type { BankedQuestion } from './question-bank'

/**
 * The flags rubric, dealt from `flag-bank.json` rather than written into the
 * question bank: the bank is rebuilt from a dozen downloads over an hour, and a
 * flag needs nothing but the file `scripts/build-flag-bank.ts` drew and the
 * name the map already gives its country.
 */
const flagBankSchema = z.array(
  z.object({
    code: countryCodeSchema,
    decoys: z.tuple([countryCodeSchema, countryCodeSchema, countryCodeSchema]),
    file: flagFileSchema,
    isWellKnown: z.boolean()
  })
)

const PROMPT_BY_LANGUAGE = {
  en: 'Whose flag is this?',
  fr: 'À qui est ce drapeau ?'
} as const satisfies Record<QuestionLanguage, string>

let flagQuestions: BankedQuestion[] | undefined

/**
 * Every flag in both languages, built on the first draw like the bank. The id
 * is the file's, never the country's: it travels to every player with the
 * prompt.
 */
export const bankedFlagQuestions = (): BankedQuestion[] => {
  flagQuestions ??= flagBankSchema.parse(flagBank).flatMap((flag) =>
    questionLanguages.map((language) => {
      const names = COUNTRY_NAMES_BY_LANGUAGE[language]

      return {
        accepted: acceptedCountryNames({ code: flag.code, language }),
        answer: names[flag.code].name,
        category: 'flags' as const,
        choiceOnly: false,
        decoys: [
          names[flag.decoys[0]].name,
          names[flag.decoys[1]].name,
          names[flag.decoys[2]].name
        ] as const,
        flag: flag.file,
        id: `flag-${language}-${flag.file.replace('.svg', '')}`,
        isAdult: false,
        isWellKnown: flag.isWellKnown,
        language,
        note: null,
        prompt: PROMPT_BY_LANGUAGE[language],
        rebus: null,
        silhouette: null,
        theme: 'flag-icons'
      }
    })
  )

  return flagQuestions
}
