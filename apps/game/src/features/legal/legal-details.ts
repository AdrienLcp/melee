import type { Locale } from '@taverla/protocol/locale'

/**
 * Who publishes Taverla and how to reach him. A non-professional publisher
 * gives a name and a contact, never a postal address or a phone number (LCEN,
 * article 6-III-2).
 */
export const PUBLISHER = {
  contactHrefFor: {
    en: 'https://adrienlcp.com/en/contact',
    fr: 'https://adrienlcp.com/fr/contact'
  } satisfies Record<Locale, string>,
  name: 'Adrien Lacourpaille'
} as const

/** The Worker, its Durable Objects and the custom domain are all Cloudflare's. */
export const HOST = {
  addressLines: ['101 Townsend St', 'San Francisco, CA 94107', 'USA'],
  name: 'Cloudflare, Inc.'
} as const

/** The longest the measurement's raw records are kept, the CNIL's ceiling. */
export const MEASUREMENT_RETENTION_MONTHS = 25

export const CNIL_COMPLAINT_HREF = 'https://www.cnil.fr/fr/plaintes'

export const DEEZER_PRIVACY_HREF = 'https://www.deezer.com/legal/personal-datas'
