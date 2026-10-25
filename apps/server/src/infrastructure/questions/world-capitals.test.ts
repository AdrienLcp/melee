import { describe, expect, it } from 'vitest'

import { BANKED_COUNTRIES } from './country-bank'
import { worldCapitals } from './world-capitals'

describe('the capitals a map round asks', () => {
  it('[worldmap] asks a capital for every banked country but the two the capital bank leaves out', () => {
    const asked = new Set(worldCapitals().map(({ countryCode }) => countryCode))

    expect(BANKED_COUNTRIES.filter((code) => !asked.has(code))).toEqual([
      'ISR',
      'GRL'
    ])
  })
})
