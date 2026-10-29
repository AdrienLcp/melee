import { describe, expect, it } from 'vitest'

import { QUANTITY_FAMILIES } from '@melee/protocol/estimate'

import { bankedQuantities } from './quantity-bank'

/** The fewest well-known rows a family needs to fill an evening of twenty rounds alone. */
const WELL_KNOWN_FLOOR = 30

const bankedValueOf = (englishName: string) =>
  bankedQuantities().find(({ names }) => names.en === englishName)?.value

describe('the quantity bank', () => {
  it('[estimate] holds an evening of well-known rows in every family', () => {
    const thin = QUANTITY_FAMILIES.filter(
      (family) =>
        bankedQuantities().filter(
          (row) => row.family === family && row.isWellKnown
        ).length < WELL_KNOWN_FLOOR
    )

    expect(thin).toEqual([])
  })

  it('[estimate] holds one row per place in a family, and one per name', () => {
    for (const key of [
      ({ entity }: { entity: string }) => entity,
      ({ names }: { names: { fr: string } }) => names.fr.toLowerCase()
    ]) {
      const keys = bankedQuantities().map((row) => `${row.family}:${key(row)}`)

      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('[estimate] rounds every value to three significant figures', () => {
    const unrounded = bankedQuantities().filter(
      ({ value }) => Number(value.toPrecision(3)) !== value
    )

    expect(unrounded).toEqual([])
  })

  it('[estimate] counts each family in its own unit', () => {
    expect(bankedValueOf('Mount Everest')).toBe(8_850)
    expect(bankedValueOf('Nile')).toBe(6_650)
    expect(bankedValueOf('Eiffel Tower')).toBe(330)
  })

  it('[estimate] asks the height of a tower standing today, never of one being built', () => {
    expect(bankedValueOf('Jeddah Tower')).toBeUndefined()
  })
})
