import { z } from 'zod'

import {
  type CountryCode,
  countryCodeSchema
} from '@melee/protocol/country-code'
import {
  flagFileSchema,
  type QuestionLanguage,
  questionLanguages
} from '@melee/protocol/question'

import {
  type ContentTier,
  contentTiers
} from '@melee/core/round/difficulty-draw'

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
    easyDecoys: z.tuple([
      countryCodeSchema,
      countryCodeSchema,
      countryCodeSchema
    ]),
    file: flagFileSchema,
    tier: z.enum(contentTiers)
  })
)

const PROMPT_BY_LANGUAGE = {
  en: 'Whose flag is this?',
  fr: 'À qui est ce drapeau ?'
} as const satisfies Record<QuestionLanguage, string>

let parsedFlags: z.infer<typeof flagBankSchema> | undefined

const flagRows = (): z.infer<typeof flagBankSchema> => {
  parsedFlags ??= flagBankSchema.parse(flagBank)

  return parsedFlags
}

let tierByCountry: ReadonlyMap<CountryCode, ContentTier> | undefined

/**
 * How well a table knows a country, which its flag's tier is the one list of:
 * the map reads it too. A country with no flag of its own is `hard`.
 */
export const countryTierOf = (code: CountryCode): ContentTier => {
  tierByCountry ??= new Map(flagRows().map(({ code, tier }) => [code, tier]))

  return tierByCountry.get(code) ?? 'hard'
}

let flagQuestions: BankedQuestion[] | undefined

/**
 * Every flag in both languages, built on the first draw like the bank. The id
 * is the file's, never the country's: it travels to every player with the
 * prompt.
 */
export const bankedFlagQuestions = (): BankedQuestion[] => {
  flagQuestions ??= flagRows().flatMap((flag) =>
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
        easyDecoys: [
          names[flag.easyDecoys[0]].name,
          names[flag.easyDecoys[1]].name,
          names[flag.easyDecoys[2]].name
        ] as const,
        flag: flag.file,
        id: `flag-${language}-${flag.file.replace('.svg', '')}`,
        isAdult: false,
        isWellKnown: flag.tier === 'easy',
        language,
        note: null,
        prompt: PROMPT_BY_LANGUAGE[language],
        rebus: null,
        silhouette: null,
        theme: 'flag-icons',
        tier: flag.tier
      }
    })
  )

  return flagQuestions
}
