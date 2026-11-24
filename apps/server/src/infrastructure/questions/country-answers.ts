import type { CountryCode } from '@melee/protocol/country-code'
import { byLocale, type LocalizedText } from '@melee/protocol/locale'
import {
  type QuestionLanguage,
  questionLanguages
} from '@melee/protocol/question'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'
import { COUNTRY_NAMES_PT } from '@melee/core/countries/country-names-pt'

/** A country's name as every rubric naming one answers it. */
export const COUNTRY_NAMES_BY_LANGUAGE = {
  en: COUNTRY_NAMES_EN,
  fr: COUNTRY_NAMES_FR,
  pt: COUNTRY_NAMES_PT
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
    COG: ['Congo', 'Congo-Brazzaville'],
    CZE: ['République tchèque'],
    GBR: ['Grande-Bretagne'],
    MKD: ['Macédoine'],
    MMR: ['Myanmar'],
    NLD: ['Hollande'],
    SWZ: ['Swaziland'],
    TLS: ['Timor-Leste'],
    USA: ['USA', 'États-Unis d’Amérique'],
    VAT: ['Saint-Siège']
  },
  pt: {
    ARE: ['Emirados', 'EAU'],
    BIH: ['Bósnia'],
    COD: ['RDC', 'Congo-Kinshasa'],
    COG: ['Congo', 'Congo-Brazzaville'],
    CZE: ['Chéquia'],
    GBR: ['Grã-Bretanha'],
    MKD: ['Macedónia'],
    MMR: ['Myanmar'],
    NLD: ['Holanda'],
    SWZ: ['Suazilândia'],
    TLS: ['Timor'],
    USA: ['EUA', 'América', 'Estados Unidos da América'],
    VAT: ['Santa Sé']
  }
} as const satisfies Record<
  QuestionLanguage,
  Partial<Record<CountryCode, readonly string[]>>
>

export const acceptedCountryNames = ({
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

/** A country's name in every language a screen reads it in. */
export const localizedCountryName = (code: CountryCode): LocalizedText =>
  byLocale((locale) => COUNTRY_NAMES_BY_LANGUAGE[locale][code].name)

/** Every name a table may type for a country beside the map's, whatever language it types in. */
export const acceptedCountryNamesInEveryLanguage = (
  code: CountryCode
): string[] => [
  ...new Set(
    questionLanguages.flatMap((language) =>
      acceptedCountryNames({ code, language })
    )
  )
]

/** Three countries' names, in the order their codes came: choice i is the same country in every language. */
export const localizedCountryNames = (
  codes: readonly [CountryCode, CountryCode, CountryCode]
): [LocalizedText, LocalizedText, LocalizedText] => [
  localizedCountryName(codes[0]),
  localizedCountryName(codes[1]),
  localizedCountryName(codes[2])
]
