import { describe, expect, it } from 'vitest'

import { QUANTITY_FAMILIES } from '@melee/protocol/estimate'

import { WIDE_PAIR_BAND } from '@melee/core/higherlower/pair-deal'
import { contentTiers } from '@melee/core/round/difficulty-draw'

import { FAMOUS_QUANTITY_NAMES, isFamousQuantity } from './famous-quantities'
import {
  bankedQuantities,
  drawPairs,
  drawQuantity,
  playedPairedQuantityId,
  type QuantityRow,
  tierOfQuantity
} from './quantity-bank'

/** Four evenings of twenty rounds, which a level dealt from one tier alone must last. */
const TIER_FLOOR = 80

/** France's thirteen metropolitan regions and its five overseas ones. */
const FRENCH_REGIONS = 18

const bankedValueOf = (englishName: string) =>
  bankedQuantities().find(({ names }) => names.en === englishName)?.value

const bankedRow = ({
  family,
  fr
}: Pick<QuantityRow, 'family'> & { fr: string }) =>
  bankedQuantities().find((row) => row.family === family && row.names.fr === fr)

describe('the quantity bank', () => {
  it('[difficulty] holds four evenings of rows in every tier', () => {
    const thin = contentTiers.filter(
      (tier) =>
        bankedQuantities().filter((row) => tierOfQuantity(row) === tier)
          .length < TIER_FLOOR
    )

    expect(thin).toEqual([])
  })

  it('[estimate] holds every family, and every region of France', () => {
    const empty = QUANTITY_FAMILIES.filter(
      (family) => !bankedQuantities().some((row) => row.family === family)
    )

    expect(empty).toEqual([])

    for (const family of ['area.region', 'population.region'] as const) {
      expect(
        bankedQuantities().filter((row) => row.family === family)
      ).toHaveLength(FRENCH_REGIONS)
    }
  })

  it('[estimate] measures a French town by its commune, Paris included', () => {
    expect(bankedRow({ family: 'area.city', fr: 'Paris' })?.value).toBe(105)
    expect(bankedRow({ family: 'area.city', fr: 'Marseille' })?.value).toBe(241)
  })

  it('[difficulty] knows a place shared with a neighbour as a French one', () => {
    for (const [family, fr] of [
      ['area.country', 'France'],
      ['elevation.mountain', 'mont Blanc'],
      ['length.river', 'Rhin'],
      ['population.city', 'Lyon']
    ] as const) {
      expect(bankedRow({ family, fr })?.isInFrance).toBe(true)
    }

    expect(
      bankedRow({ family: 'length.river', fr: 'Danube' })?.isInFrance
    ).toBe(false)
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

  it('[difficulty] holds France on one side of every pair at easy, never a near tie', () => {
    const playedIds = new Set<string>()

    for (let round = 0; round < 48; round++) {
      for (const { left, right } of drawPairs({
        difficulty: 'easy',
        playedIds
      }) ?? []) {
        const ratio =
          Math.max(left.value, right.value) / Math.min(left.value, right.value)

        expect(left.isInFrance || right.isInFrance).toBe(true)
        expect(ratio).toBeGreaterThanOrEqual(WIDE_PAIR_BAND.min)
        expect(ratio).toBeLessThanOrEqual(WIDE_PAIR_BAND.max)

        playedIds.add(playedPairedQuantityId(left))
        playedIds.add(playedPairedQuantityId(right))
      }
    }
  })

  // Four standard deviations either side of a third, so the bounds hold on every run.
  it('[difficulty] asks a third of its estimates from the famous tier when mixed', {
    timeout: 15_000
  }, () => {
    const draws = 450
    const famous = Array.from({ length: draws }, () =>
      drawQuantity({ difficulty: 'mixed', playedIds: new Set() })
    ).filter((row) => row !== null && isFamousQuantity(row)).length

    expect(famous / draws).toBeGreaterThan(0.25)
    expect(famous / draws).toBeLessThan(0.42)
  })

  it('[difficulty] deals four evenings of famous pairs at easy without comparing a row twice', () => {
    const playedIds = new Set<string>()

    for (let round = 0; round < 48; round++) {
      const pairs = drawPairs({ difficulty: 'easy', playedIds })

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
