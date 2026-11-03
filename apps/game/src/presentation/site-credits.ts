import type { Locale } from '@melee/protocol/locale'

/** The author the menu credits beside the legal link, linked to his site in the reader's language. */
export const AUTHOR = {
  name: 'Adrien Lacourpaille',
  siteHref: {
    en: 'https://adrienlcp.com/en',
    fr: 'https://adrienlcp.com/fr'
  }
} as const satisfies { name: string; siteHref: Record<Locale, string> }

/** Melee's public repository, linked from the menu and from the credits page's share-alike line. */
export const SOURCE_REPOSITORY_HREF = 'https://github.com/AdrienLcp/melee'
