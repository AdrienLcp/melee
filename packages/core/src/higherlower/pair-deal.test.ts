import { describe, expect, it } from 'vitest'

import {
  QUANTITY_FAMILIES,
  type QuantityFamily
} from '@melee/protocol/estimate'
import { HIGHER_LOWER_PAIR_COUNT } from '@melee/protocol/higher-lower'

import {
  type ComparableQuantity,
  dealPairs,
  higherSideOf,
  MAX_PAIR_RATIO,
  MIN_FAMILIES_PER_ROUND,
  MIN_PAIR_RATIO
} from './pair-deal'

const rowsOf = ({
  count,
  family,
  firstValue = 100
}: {
  count: number
  family: QuantityFamily
  firstValue?: number
}): ComparableQuantity[] =>
  Array.from({ length: count }, (_, index) => ({
    entity: `${family}-${index}`,
    family,
    value: firstValue * 1.3 ** index
  }))

const everyFamily = QUANTITY_FAMILIES.flatMap((family) =>
  rowsOf({ count: 12, family })
)

describe('dealPairs', () => {
  it('[higherlower] deals fair pairs of one family each, from as many families as the round asks', () => {
    for (let draw = 0; draw < 200; draw++) {
      const pairs = dealPairs(everyFamily)

      expect(pairs).toHaveLength(HIGHER_LOWER_PAIR_COUNT)

      for (const { left, right } of pairs ?? []) {
        const ratio =
          Math.max(left.value, right.value) / Math.min(left.value, right.value)

        expect(left.family).toBe(right.family)
        expect(ratio).toBeGreaterThanOrEqual(MIN_PAIR_RATIO)
        expect(ratio).toBeLessThanOrEqual(MAX_PAIR_RATIO)
      }

      expect(
        new Set(pairs?.map(({ left }) => left.family)).size
      ).toBeGreaterThanOrEqual(MIN_FAMILIES_PER_ROUND)
    }
  })

  it('[higherlower] never deals one entity twice in a round, even across families', () => {
    const sharedPlaces = [
      ...rowsOf({ count: 6, family: 'area.country' }),
      ...rowsOf({ count: 6, family: 'population.country' }).map(
        (row, index) => ({ ...row, entity: `area.country-${index}` })
      ),
      ...rowsOf({ count: 6, family: 'length.river' })
    ]

    for (let draw = 0; draw < 200; draw++) {
      const entities = (dealPairs(sharedPlaces) ?? []).flatMap(
        ({ left, right }) => [left.entity, right.entity]
      )

      expect(new Set(entities).size).toBe(entities.length)
    }
  })

  it('[higherlower] puts the higher value on either side, never always the same', () => {
    const sides = new Set(
      Array.from({ length: 50 }, () => dealPairs(everyFamily) ?? []).flatMap(
        (pairs) => pairs.map(higherSideOf)
      )
    )

    expect(sides).toEqual(new Set(['left', 'right']))
  })

  it('[higherlower] refuses values too far apart to compare', () => {
    expect(
      dealPairs(
        QUANTITY_FAMILIES.flatMap((family) =>
          [1, 10, 100, 1000].map((value) => ({
            entity: `${family}-${value}`,
            family,
            value
          }))
        )
      )
    ).toBeNull()
  })
})
