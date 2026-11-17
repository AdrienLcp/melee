import { describe, expect, it } from 'vitest'

import { z } from 'zod'

import { isLocale, localizedSchema } from './locale'

describe('isLocale', () => {
  it('[locale] accepts a language this product ships a dictionary for', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(true)
  })

  // A region tag is not a dictionary key. Turning `fr-CA` into `fr` is
  // negotiation, and belongs to whoever is choosing a locale — not to a guard
  // reading a value back out of storage or a URL.
  it('[locale] rejects a region tag and an unshipped language alike', () => {
    expect(isLocale('fr-FR')).toBe(false)
    expect(isLocale('de')).toBe(false)
    expect(isLocale('')).toBe(false)
  })
})

describe('localizedSchema', () => {
  const namesSchema = localizedSchema(z.string().min(1))

  it('[locale] drops a language not shipped yet', () => {
    expect(
      namesSchema.parse({ de: 'Lissabon', en: 'Lisbon', fr: 'Lisbonne' })
    ).toEqual({ en: 'Lisbon', fr: 'Lisbonne' })
  })

  it('[locale] refuses a value missing a shipped language', () => {
    expect(namesSchema.safeParse({ en: 'Lisbon' }).success).toBe(false)
  })
})
