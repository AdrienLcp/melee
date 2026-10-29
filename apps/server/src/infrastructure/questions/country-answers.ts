import type { CountryCode } from '@melee/protocol/country-code'
import type { QuestionLanguage } from '@melee/protocol/question'

import { COUNTRY_NAMES_EN } from '@melee/core/countries/country-names-en'
import { COUNTRY_NAMES_FR } from '@melee/core/countries/country-names-fr'

/** A country's name as every rubric naming one answers it. */
export const COUNTRY_NAMES_BY_LANGUAGE = {
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
