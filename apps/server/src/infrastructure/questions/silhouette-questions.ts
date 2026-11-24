import { z } from 'zod'

import {
  type CountryCode,
  countryCodeSchema
} from '@melee/protocol/country-code'
import type { LocalizedText } from '@melee/protocol/locale'
import {
  type SilhouetteFile,
  silhouetteFileSchema
} from '@melee/protocol/question'

import { contentTiers } from '@melee/core/round/difficulty-draw'

import {
  acceptedCountryNamesInEveryLanguage,
  localizedCountryName,
  localizedCountryNames
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
    easyDecoys: z.tuple([
      countryCodeSchema,
      countryCodeSchema,
      countryCodeSchema
    ]),
    file: silhouetteFileSchema,
    /** Measured on the drawn path by `scripts/outline-measure.ts`. */
    outline: z.object({
      compactness: z.number().positive(),
      elongation: z.number().min(1)
    }),
    tier: z.enum(contentTiers)
  })
)

/** How stretched and how compact a silhouette is drawn, which tells two outlines apart at a glance. */
export type SilhouetteOutline = z.infer<
  typeof silhouetteBankSchema
>[number]['outline']

const SILHOUETTE_PROMPT = {
  en: 'Which country has this shape?',
  fr: 'Quel pays a cette forme ?',
  pt: 'Que país tem esta forma?'
} as const satisfies LocalizedText

let silhouetteQuestions: BankedQuestion[] | undefined

/** Every outline, each one question read in every language; the id is the file's, never the country's. */
export const bankedSilhouetteQuestions = (): BankedQuestion[] => {
  silhouetteQuestions ??= silhouetteBankSchema
    .parse(silhouetteBank)
    .map((silhouette) => ({
      accepted: acceptedCountryNamesInEveryLanguage(silhouette.code),
      answer: localizedCountryName(silhouette.code),
      category: 'silhouettes' as const,
      choiceOnly: false,
      decoys: localizedCountryNames(silhouette.decoys),
      easyDecoys: localizedCountryNames(silhouette.easyDecoys),
      flag: null,
      id: `silhouette-${silhouette.file.replace('.svg', '')}`,
      isAdult: false,
      isWellKnown: silhouette.tier === 'easy',
      language: null,
      note: null,
      prompt: SILHOUETTE_PROMPT,
      rebus: null,
      silhouette: silhouette.file,
      theme: 'natural-earth',
      tier: silhouette.tier
    }))

  return silhouetteQuestions
}

let silhouetteFiles: ReadonlyMap<CountryCode, SilhouetteFile> | undefined

/** The country's outline, or `null` for one of the microstates the atlas cannot draw. */
export const silhouetteFileOf = (code: CountryCode): SilhouetteFile | null => {
  silhouetteFiles ??= new Map(
    silhouetteBankSchema
      .parse(silhouetteBank)
      .map(({ code, file }) => [code, file])
  )

  return silhouetteFiles.get(code) ?? null
}

let silhouetteOutlines: ReadonlyMap<CountryCode, SilhouetteOutline> | undefined

/** How the country's silhouette is shaped, or `null` for a country the rubric draws no outline of. */
export const silhouetteOutlineOf = (
  code: CountryCode
): SilhouetteOutline | null => {
  silhouetteOutlines ??= new Map(
    silhouetteBankSchema
      .parse(silhouetteBank)
      .map(({ code, outline }) => [code, outline])
  )

  return silhouetteOutlines.get(code) ?? null
}
