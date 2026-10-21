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

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'

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

const NAMES_BY_LANGUAGE = {
  en: COUNTRY_NAMES_EN,
  fr: COUNTRY_NAMES_FR
} as const satisfies Record<
  QuestionLanguage,
  Record<CountryCode, { name: string }>
>

/** What a table says instead of the name the map prints. */
const ACCEPTED_BY_LANGUAGE = {
  en: {
    ARE: ['UAE', 'Emirates'],
    BIH: ['Bosnia'],
    CIV: ['Ivory Coast'],
    COD: ['DRC', 'DR Congo', 'Congo-Kinshasa'],
    COG: ['Congo-Brazzaville'],
    CPV: ['Cabo Verde'],
    CZE: ['Czech Republic'],
    GBR: ['UK', 'Great Britain', 'Britain'],
    MKD: ['Macedonia'],
    MMR: ['Burma'],
    NLD: ['Holland'],
    SWZ: ['Swaziland'],
    TLS: ['East Timor'],
    USA: ['USA', 'America', 'United States of America'],
    VAT: ['Vatican', 'Holy See']
  },
  fr: {
    ARE: ['Émirats', 'EAU'],
    BIH: ['Bosnie'],
    CAF: ['République centrafricaine'],
    COD: ['RDC', 'Congo-Kinshasa'],
    COG: ['Congo-Brazzaville', 'République du Congo'],
    CZE: ['République tchèque'],
    GBR: ['Grande-Bretagne'],
    MKD: ['Macédoine'],
    MMR: ['Myanmar'],
    NLD: ['Hollande'],
    SWZ: ['Swaziland'],
    TLS: ['Timor-Leste'],
    USA: ['USA', 'États-Unis d’Amérique'],
    VAT: ['Saint-Siège']
  }
} as const satisfies Record<
  QuestionLanguage,
  Partial<Record<CountryCode, readonly string[]>>
>

const acceptedFor = ({
  code,
  language
}: {
  code: CountryCode
  language: QuestionLanguage
}): string[] => {
  const accepted: Partial<Record<CountryCode, readonly string[]>> =
    ACCEPTED_BY_LANGUAGE[language]

  return [...(accepted[code] ?? [])]
}

let flagQuestions: BankedQuestion[] | undefined

/**
 * Every flag in both languages, built on the first draw like the bank. The id
 * is the file's, never the country's: it travels to every player with the
 * prompt.
 */
export const bankedFlagQuestions = (): BankedQuestion[] => {
  flagQuestions ??= flagBankSchema.parse(flagBank).flatMap((flag) =>
    questionLanguages.map((language) => {
      const names = NAMES_BY_LANGUAGE[language]

      return {
        accepted: acceptedFor({ code: flag.code, language }),
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
        theme: 'flag-icons'
      }
    })
  )

  return flagQuestions
}
