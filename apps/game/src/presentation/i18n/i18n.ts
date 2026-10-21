import { createI18n } from '@adrienlcp/i18n'

import { DEFAULT_LOCALE, type Locale } from '@melee/protocol/locale'

import { EN_DICTIONARY } from './dictionary-en'

/**
 * Where this app's locales meet this app's dictionaries, once. Everything past
 * here passes a locale and nothing else.
 *
 * `satisfies` rather than an annotation: it holds the registry to the contract's
 * `LOCALES` — adding one there stops compiling here until a dictionary exists —
 * while leaving the keys as literals, which is what `createI18n` reads to decide
 * what `translator` and `negotiate` accept.
 *
 * French is a chunk of its own, so a reader in English never downloads it.
 * Whatever renders in French awaits `i18n.load` first — the entry, the
 * prerender and a switch of language — because `translator` answers in English
 * until it lands.
 */
export const i18n = createI18n({
  defaultLocale: DEFAULT_LOCALE,
  dictionaries: {
    en: EN_DICTIONARY,
    fr: () =>
      import('./dictionary-fr').then(({ FR_DICTIONARY }) => ({
        default: FR_DICTIONARY
      }))
  } satisfies Record<Locale, unknown>
})
