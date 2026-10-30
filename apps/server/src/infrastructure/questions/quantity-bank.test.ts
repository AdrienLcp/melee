import { describe, expect, it } from 'vitest'

import { QUANTITY_FAMILIES } from '@melee/protocol/estimate'

import { FAMOUS_QUANTITY_NAMES, isFamousQuantity } from './famous-quantities'
import {
  bankedQuantities,
  drawPairs,
  playedPairedQuantityId
} from './quantity-bank'

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

  it('[higherlower] names no famous row the bank does not hold', () => {
    const unbanked = QUANTITY_FAMILIES.flatMap((family) =>
      FAMOUS_QUANTITY_NAMES[family].filter(
        (fr) =>
          !isFamousQuantity({ family, names: { fr } }) ||
          !bankedQuantities().some(
            (row) => row.family === family && row.names.fr === fr
          )
      )
    )

    expect(unbanked).toEqual([])
  })

  it('[higherlower] deals four evenings of famous pairs without comparing a row twice', () => {
    const playedIds = new Set<string>()

    for (let round = 0; round < 48; round++) {
      const pairs = drawPairs({ playedIds })

      expect(pairs).toHaveLength(1)

      for (const { left, right } of pairs ?? []) {
        expect([isFamousQuantity(left), isFamousQuantity(right)]).toEqual([
          true,
          true
        ])

        for (const row of [left, right]) {
          expect(playedIds.has(playedPairedQuantityId(row))).toBe(false)
          playedIds.add(playedPairedQuantityId(row))
        }
      }
    }
  })
})
