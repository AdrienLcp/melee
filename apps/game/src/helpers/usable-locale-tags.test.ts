import { describe, expect, it } from 'vitest'

import { usableLocaleTags } from './usable-locale-tags'

describe('usable locale tags', () => {
  it('[locale] keeps well-formed tags in order', () => {
    expect(usableLocaleTags(['fr-FR', 'fr', 'en-US'])).toEqual([
      'fr-FR',
      'fr',
      'en-US'
    ])
  })

  it('[locale] drops an Accept-Language weight and keeps the language behind it', () => {
    expect(usableLocaleTags(['en-GB', 'en;q=0.9'])).toEqual(['en-GB', 'en'])
  })

  it('[locale] skips a tag Intl refuses, so a formatter built over the list does not throw', () => {
    const tags = usableLocaleTags(['not a tag', '', 'pt-PT'])

    expect(tags).toEqual(['pt-PT'])
    expect(() => new Intl.NumberFormat(tags)).not.toThrow()
  })

  it('[locale] lists a tag once when its weight made it a duplicate', () => {
    expect(usableLocaleTags(['en', 'en;q=0.9'])).toEqual(['en'])
  })
})
