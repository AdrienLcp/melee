import { z } from 'zod'

import {
  type CountryCode,
  countryCodeSchema
} from '@melee/protocol/country-code'
import type { LocalizedText } from '@melee/protocol/locale'
import { type FlagFile, flagFileSchema } from '@melee/protocol/question'

import {
  type ContentTier,
  contentTiers
} from '@melee/core/round/difficulty-draw'

import {
  acceptedCountryNamesInEveryLanguage,
  localizedCountryName,
  localizedCountryNames
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
    isSovereign: z.boolean(),
    tier: z.enum(contentTiers)
  })
)

const FLAG_PROMPT = {
  en: 'Whose flag is this?',
  fr: 'À qui est ce drapeau ?',
  pt: 'De quem é esta bandeira?'
} as const satisfies LocalizedText

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

let flagFiles: ReadonlyMap<CountryCode, FlagFile> | undefined

/** The country's flag as `scripts/build-flag-bank.ts` drew it, or `null` for one the bank has none of. */
export const flagFileOf = (code: CountryCode): FlagFile | null => {
  flagFiles ??= new Map(flagRows().map(({ code, file }) => [code, file]))

  return flagFiles.get(code) ?? null
}

let flagQuestions: BankedQuestion[] | undefined

/**
 * Every sovereign state's flag, each one question read in every language. The
 * id is the file's, never the country's: it travels to every player with the
 * prompt.
 *
 * **States only.** The territories keep their flags for the map and five
 * clues, but dealt here they were thirty-five hard flags among a hundred and
 * ninety-four, nearly all medium or hard — Greenland, Puerto Rico, Hong Kong —
 * and the rubric felt like a test rather than any flag at random.
 */
export const bankedFlagQuestions = (): BankedQuestion[] => {
  flagQuestions ??= flagRows()
    .filter(({ isSovereign }) => isSovereign)
    .map((flag) => ({
      accepted: acceptedCountryNamesInEveryLanguage(flag.code),
      answer: localizedCountryName(flag.code),
      category: 'flags' as const,
      choiceOnly: false,
      decoys: localizedCountryNames(flag.decoys),
      easyDecoys: localizedCountryNames(flag.easyDecoys),
      flag: flag.file,
      id: `flag-${flag.file.replace('.svg', '')}`,
      isAdult: false,
      isWellKnown: flag.tier === 'easy',
      language: null,
      note: null,
      prompt: FLAG_PROMPT,
      rebus: null,
      silhouette: null,
      theme: 'flag-icons',
      tier: flag.tier
    }))

  return flagQuestions
}
