import { describe, expect, it } from 'vitest'

import { robotsTxt } from './site-index'

const ORIGIN = 'https://melee.example'
const RULES = 'User-agent: *\nAllow: /\n'

describe('robotsTxt', () => {
  it('[robots] keeps the file and points at the sitemap of the origin asked', () => {
    expect(robotsTxt({ isIndexable: true, origin: ORIGIN, rules: RULES })).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://melee.example/sitemap.xml\n'
    )
  })

  it('[robots] bars every crawler from a deployment that must stay unlisted', () => {
    expect(
      robotsTxt({ isIndexable: false, origin: ORIGIN, rules: RULES })
    ).toBe('User-agent: *\nDisallow: /\n')
  })
})
