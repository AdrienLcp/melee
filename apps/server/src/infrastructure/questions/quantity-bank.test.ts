// cspell:words Lisbonne Séville
import { describe, expect, it } from 'vitest'

import {
  QUANTITY_TOPICS,
  WIKIDATA_QUANTITY_FAMILIES
} from '@melee/protocol/estimate'

import { WIDE_PAIR_BAND } from '@melee/core/higherlower/pair-deal'
import { contentTiers } from '@melee/core/round/difficulty-draw'

import { FAMOUS_IN_PORTUGAL } from './famous-in-portugal'
import { FAMOUS_QUANTITY_NAMES, isFamousQuantity } from './famous-quantities'
import priceBank from './price-bank.json' with { type: 'json' }
import {
  bankedPrices,
  bankedQuantities,
  bankQuestionOf,
  drawPairs,
  drawQuantity,
  pairPictureOf,
  playedPairedQuantityId,
  playedQuantityId,
  type QuantityRow,
  tierOfQuantity
} from './quantity-bank'
import bank from './quantity-bank.json' with { type: 'json' }

/** Four evenings of twenty rounds, which a level dealt from one tier alone must last. */
const TIER_FLOOR = 80

/** France's thirteen metropolitan regions and its five overseas ones. */
const FRENCH_REGIONS = 18

const TABLES = ['FRA', 'PRT', null] as const

const tierAtFrenchTable = (row: QuantityRow) =>
  tierOfQuantity({ homeCountry: 'FRA', row })

const bankedValueOf = (englishName: string) =>
  bankedQuantities().find(({ names }) => names.en === englishName)?.value

const bankedRow = ({
  family,
  fr
}: Pick<QuantityRow, 'family'> & { fr: string }) =>
  bankedQuantities().find((row) => row.family === family && row.names.fr === fr)

describe('the quantity bank', () => {
  it.each(TABLES)(
    '[difficulty] holds four evenings of rows in every tier at a table of %s',
    (homeCountry) => {
      const thin = contentTiers.filter(
        (tier) =>
          bankedQuantities().filter(
            (row) =>
              (row.homeCountry === null || row.homeCountry === homeCountry) &&
              tierOfQuantity({ homeCountry, row }) === tier
          ).length < TIER_FLOOR
      )

      expect(thin).toEqual([])
    }
  )

  it('[estimate] names every row and every price in Portuguese', () => {
    const unnamed = [...bank, ...priceBank].filter((row) => {
      const pt = new Map(Object.entries(row.names)).get('pt')

      return pt === undefined || pt.trim() === ''
    })

    expect(unnamed).toEqual([])
  })

  it('[estimate] keeps a place everyone knows for every table, wherever it lies', () => {
    for (const [family, fr] of [
      ['height.building', 'tour Eiffel'],
      ['length.river', 'Seine'],
      ['population.city', 'Paris'],
      ['area.country', 'France']
    ] as const) {
      expect(bankedRow({ family, fr })?.homeCountry).toBeNull()
    }

    for (const fr of [
      'Madrid',
      'Séville',
      'Buenos Aires',
      'Bruxelles',
      'Los Angeles',
      'Lisbonne'
    ]) {
      expect(
        bankedRow({ family: 'population.city', fr })?.homeCountry
      ).toBeNull()
    }

    for (const [family, fr] of [
      ['area.city', 'Paris'],
      ['population.department', 'Creuse'],
      ['area.region', 'Bretagne']
    ] as const) {
      expect(bankedRow({ family, fr })?.homeCountry).toBe('FRA')
    }
  })

  it.each([
    { homeCountry: 'PRT', own: 'PRT' },
    { homeCountry: 'FRA', own: 'FRA' },
    { homeCountry: null, own: null }
  ] as const)(
    "[estimate] deals a table of $homeCountry everyone's rows and its own, never another country's",
    {
      timeout: 15_000
    },
    ({ homeCountry, own }) => {
      const homes = new Set(
        Array.from({ length: 400 }, () =>
          drawQuantity({
            difficulty: 'mixed',
            homeCountry,
            playedIds: new Set(),
            topics: QUANTITY_TOPICS
          })
        ).map((row) => row?.homeCountry)
      )

      expect(homes).toEqual(new Set(own === null ? [null] : [null, own]))
    }
  )

  it('[estimate] holds every family, and every region of France', () => {
    const empty = WIKIDATA_QUANTITY_FAMILIES.filter(
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
      expect(bankedRow({ family, fr })?.liesIn).toContain('FRA')
    }

    expect(bankedRow({ family: 'length.river', fr: 'Danube' })?.liesIn).toEqual(
      []
    )
    expect(bankedRow({ family: 'length.river', fr: 'Tage' })?.liesIn).toEqual([
      'PRT'
    ])
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
    const unbanked = WIKIDATA_QUANTITY_FAMILIES.flatMap((family) =>
      FAMOUS_QUANTITY_NAMES[family].filter(
        (fr) =>
          !isFamousQuantity({
            country: 'FRA',
            entity: '',
            family,
            names: { fr }
          }) ||
          !bankedQuantities().some(
            (row) => row.family === family && row.names.fr === fr
          )
      )
    )

    expect(unbanked).toEqual([])
  })

  it('[higherlower] names no row famous in Portugal the bank does not hold', () => {
    const banked = new Set(bankedQuantities().map(({ entity }) => entity))

    expect(
      Object.keys(FAMOUS_IN_PORTUGAL).filter((entity) => !banked.has(entity))
    ).toEqual([])
  })

  it.each(['FRA', 'PRT'] as const)(
    '[difficulty] holds %s on one side of every pair at easy, never a near tie',
    (homeCountry) => {
      const playedIds = new Set<string>()

      for (let round = 0; round < 48; round++) {
        for (const { left, right } of drawPairs({
          difficulty: 'easy',
          homeCountry,
          playedIds
        }) ?? []) {
          const ratio =
            Math.max(left.value, right.value) /
            Math.min(left.value, right.value)

          expect([...left.liesIn, ...right.liesIn]).toContain(homeCountry)
          expect(ratio).toBeGreaterThanOrEqual(WIDE_PAIR_BAND.min)
          expect(ratio).toBeLessThanOrEqual(WIDE_PAIR_BAND.max)

          playedIds.add(playedPairedQuantityId(left))
          playedIds.add(playedPairedQuantityId(right))
        }
      }
    }
  )

  // Four standard deviations either side of a third, so the bounds hold on every run.
  it('[difficulty] asks a third of its estimates from the famous tier when mixed', {
    timeout: 15_000
  }, () => {
    const draws = 450
    const famous = Array.from({ length: draws }, () =>
      drawQuantity({
        difficulty: 'mixed',
        homeCountry: 'FRA',
        playedIds: new Set(),
        topics: QUANTITY_TOPICS
      })
    ).filter((row) => row !== null && tierAtFrenchTable(row) === 'easy').length

    expect(famous / draws).toBeGreaterThan(0.25)
    expect(famous / draws).toBeLessThan(0.42)
  })

  it.each(TABLES)(
    '[difficulty] deals four evenings of famous pairs at easy without comparing a row twice at a table of %s',
    (homeCountry) => {
      const playedIds = new Set<string>()

      for (let round = 0; round < 48; round++) {
        const pairs = drawPairs({ difficulty: 'easy', homeCountry, playedIds })

        expect(pairs).toHaveLength(1)

        for (const { left, right } of pairs ?? []) {
          expect([
            tierOfQuantity({ homeCountry, row: left }),
            tierOfQuantity({ homeCountry, row: right })
          ]).toEqual(['easy', 'easy'])

          for (const row of [left, right]) {
            expect(playedIds.has(playedPairedQuantityId(row))).toBe(false)
            playedIds.add(playedPairedQuantityId(row))
          }
        }
      }
    }
  )

  // Four standard deviations either side of a fifth, so the bounds hold on every run.
  it('[estimate] asks a price in a fifth of the rounds of a room on every topic', {
    timeout: 15_000
  }, () => {
    const draws = 450
    const prices = Array.from({ length: draws }, () =>
      drawQuantity({
        difficulty: 'mixed',
        homeCountry: 'FRA',
        playedIds: new Set(),
        topics: QUANTITY_TOPICS
      })
    ).filter((row) => row?.family === 'price.item').length

    expect(prices / draws).toBeGreaterThan(0.12)
    expect(prices / draws).toBeLessThan(0.28)
  })

  it('[estimate] asks only the topics the room ticked, and stops once they are spent', () => {
    const playedIds = new Set<string>()
    const dealt: string[] = []
    const drawn = () =>
      drawQuantity({
        difficulty: 'mixed',
        homeCountry: 'FRA',
        playedIds,
        topics: ['price']
      })

    for (let row = drawn(); row !== null; row = drawn()) {
      dealt.push(row.family)
      playedIds.add(playedQuantityId(row))
    }

    expect(dealt).toHaveLength(
      bankedPrices().filter(({ homeCountry }) => homeCountry !== 'PRT').length
    )
    expect(new Set(dealt)).toEqual(new Set(['price.item']))
  })

  it('[estimate] prices from a coin to a budget, every tier of them stocked', () => {
    const values = bankedPrices().map(({ value }) => value)

    expect(Math.min(...values)).toBeLessThanOrEqual(2)
    expect(Math.max(...values)).toBeGreaterThanOrEqual(1e9)

    for (const homeCountry of TABLES) {
      for (const tier of contentTiers) {
        expect(
          bankedPrices().filter(
            (row) =>
              (row.homeCountry === null || row.homeCountry === homeCountry) &&
              tierOfQuantity({ homeCountry, row }) === tier
          ).length
        ).toBeGreaterThanOrEqual(8)
      }
    }
  })

  it('[estimate] holds one row per price, and one per name in each language', () => {
    for (const key of [
      ({ entity }: QuantityRow) => entity,
      ({ names }: QuantityRow) => names.fr,
      ({ names }: QuantityRow) => names.en
    ]) {
      const keys = bankedPrices().map(key)

      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('[higherlower] pairs no price yet, whose names are too long for a pair', () => {
    const playedIds = new Set<string>()

    for (let round = 0; round < 24; round++) {
      for (const { left, right } of drawPairs({
        difficulty: 'mixed',
        homeCountry: 'FRA',
        playedIds
      }) ?? []) {
        expect([left.family, right.family]).not.toContain('price.item')

        playedIds.add(playedPairedQuantityId(left))
        playedIds.add(playedPairedQuantityId(right))
      }
    }
  })
})

describe('the picture under a quantity', () => {
  it('[estimate] names the country under every population and area the map can name', () => {
    const unnamed = bankedQuantities().filter(
      ({ countryCode, family }) =>
        (family === 'population.country' || family === 'area.country') &&
        countryCode === null
    )

    expect(unnamed.map(({ names }) => names.en)).toEqual(['Tuvalu', 'Tuvalu'])
  })

  it('[estimate] draws the outline of a country and nothing under a city', () => {
    const questionOf = (english: string, family: QuantityRow['family']) => {
      const row = bankedQuantities().find(
        (candidate) =>
          candidate.names.en === english && candidate.family === family
      )

      return row === undefined ? undefined : bankQuestionOf(row)
    }

    expect(questionOf('France', 'area.country')?.silhouette).toBe(
      '0b5911a2c922.svg'
    )
    expect(questionOf('Monaco', 'area.country')?.silhouette).toBeNull()
    expect(questionOf('Lyon', 'population.city')?.silhouette).toBeNull()
  })

  it('[estimate] shows the photograph of a tower, a price and nothing over a country', () => {
    const questionOf = (english: string) => {
      const row = [...bankedQuantities(), ...bankedPrices()].find(
        (candidate) => candidate.names.en === english
      )

      return row === undefined ? undefined : bankQuestionOf(row)
    }

    expect(questionOf('Eiffel Tower')?.photo).toEqual({
      file: 'b9fa639ce03e.webp',
      height: 640,
      width: 346
    })
    expect(questionOf('Mount Everest')?.photo?.file).toBe('5516384923db.webp')
    expect(questionOf('Rubicon')?.photo).toBeNull()
    expect(questionOf('France')?.photo).toBeNull()
    expect(
      questionOf(
        'A classic baguette from a French bakery (average price, early 2025)'
      )?.photo?.file
    ).toBe('0445ca3fea6e.webp')
  })

  it('[higherlower] prints a tower by its photograph, a country by its outline and a city by nothing', () => {
    const pictureOf = (english: string, family: QuantityRow['family']) => {
      const row = bankedQuantities().find(
        (candidate) =>
          candidate.names.en === english && candidate.family === family
      )

      return row === undefined ? undefined : pairPictureOf(row)
    }

    expect(pictureOf('Eiffel Tower', 'height.building')).toEqual({
      file: 'b9fa639ce03e.webp',
      height: 640,
      kind: 'photo',
      width: 346
    })
    expect(pictureOf('France', 'area.country')).toEqual({
      file: '0b5911a2c922.svg',
      kind: 'silhouette'
    })
    expect(pictureOf('Lyon', 'population.city')).toBeNull()
  })
})
