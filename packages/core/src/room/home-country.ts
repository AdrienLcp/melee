import type { CountryCode } from '@melee/protocol/country-code'
import type { Locale } from '@melee/protocol/locale'

/**
 * The country a table is taken to sit in before anybody has said, read off the
 * host's language as `questionLanguageFor` reads the bank's. A language names
 * a country here because each locale is one country's — a Brazilian table is
 * a locale of its own, never a variant of the Portuguese one — and English is
 * spoken at too many tables to name any: it deals everyone's content alone.
 */
const HOME_COUNTRY_OF_LOCALE = {
  en: null,
  fr: 'FRA'
} as const satisfies Record<Locale, CountryCode | null>

export const homeCountryFor = (locale: Locale): CountryCode | null =>
  HOME_COUNTRY_OF_LOCALE[locale]
