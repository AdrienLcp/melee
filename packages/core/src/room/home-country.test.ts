import { describe, expect, it } from 'vitest'

import { homeCountryFor } from './home-country'

describe('homeCountryFor', () => {
  it('[home-country] seats a French host at a French table', () => {
    expect(homeCountryFor('fr')).toBe('FRA')
  })

  it('[home-country] seats an English host at a table with no country of its own', () => {
    expect(homeCountryFor('en')).toBeNull()
  })
})
