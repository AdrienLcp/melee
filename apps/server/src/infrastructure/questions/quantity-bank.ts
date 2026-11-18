import { z } from 'zod'

import {
  type CountryCode,
  countryCodeSchema
} from '@melee/protocol/country-code'
import type { Difficulty } from '@melee/protocol/difficulty'
import {
  type EstimateQuestion,
  type QuantityTopic,
  quantityFamilySchema,
  TOPIC_OF_FAMILY,
  wikidataQuantityFamilySchema
} from '@melee/protocol/estimate'
import { localizedSchema } from '@melee/protocol/locale'

import { shuffled } from '@melee/core/helpers/random'
import {
  type DealtPair,
  dealPairs,
  dealPairsBy,
  WIDE_PAIR_BAND
} from '@melee/core/higherlower/pair-deal'
import {
  type ContentTier,
  contentTiers,
  dealByDifficulty,
  drawByDifficulty
} from '@melee/core/round/difficulty-draw'

import { isFamousQuantity } from './famous-quantities'
import { photoOf } from './picture-bank'
import priceBank from './price-bank.json' with { type: 'json' }
import bank from './quantity-bank.json' with { type: 'json' }
import { silhouetteFileOf } from './silhouette-questions'

export const quantityRowSchema = z.object({
  /** The country a country's population or area measures, which names its outline; `null` on every other family. */
  countryCode: countryCodeSchema.nullable(),
  /** Its Wikidata id, which one place carries into two families — a country's population and its area. */
  entity: z.string(),
  family: quantityFamilySchema,
  /**
   * The country whose table alone is dealt it — a French department, a
   * Portuguese town, an EDF tariff — and `null` for a row every table is
   * dealt. Where a row *lies* does not decide it: the Eiffel Tower and the
   * Seine are everyone's, and only what a country's own sources measure
   * below the world's floors is its table's.
   */
  homeCountry: countryCodeSchema.nullable(),
  /**
   * The countries Wikidata puts it in, among those a table can sit in —
   * Mont Blanc and the Rhine are France's however many countries share them.
   */
  liesIn: z.array(countryCodeSchema),
  names: localizedSchema(z.string().min(1)),
  /**
   * In the family's unit, rounded to three significant figures: Wikidata's
   * population of Japan is a census figure no table should be paid on to the unit.
   */
  value: z.number().positive(),
  /** The tables that can be expected to have heard of it, by its article's traffic in each one's language. */
  wellKnownIn: z.array(countryCodeSchema)
})

export type QuantityRow = z.infer<typeof quantityRowSchema>

const wikidataRowSchema = quantityRowSchema.extend({
  family: wikidataQuantityFamilySchema
})

/**
 * A table with no country of its own plays on France's tiers: they were the
 * only ones before a second country had any, and a famous row of theirs —
 * Everest, Tokyo, the Amazon — is famous at an English table too.
 */
const TIERS_OF_A_TABLE_WITH_NO_COUNTRY: CountryCode = 'FRA'

const isDealtAt =
  (homeCountry: CountryCode | null) =>
  (row: QuantityRow): boolean =>
    row.homeCountry === null || row.homeCountry === homeCountry

/**
 * A price written by hand, worded with its reference — the year, the edition,
 * before tax or not — so the table cannot argue it, and with where it was
 * read so the bank can be audited. Its tier is picked by hand too: no traffic
 * figure says a table knows what a stamp costs and not a Steam Deck.
 */
const pricedRowSchema = z.object({
  entity: z.string(),
  homeCountry: countryCodeSchema.nullable(),
  names: localizedSchema(z.string().min(1)),
  source: z.string().min(1),
  tier: z.enum(contentTiers),
  value: z.number().positive()
})

/** Parsed on the first read, like the other banks, rather than on every cold start. */
let parsed: readonly QuantityRow[] | null = null

/** Every quantity Wikidata measured: what a pair is dealt from, and an estimate with the prices. */
export const bankedQuantities = (): readonly QuantityRow[] => {
  parsed ??= z.array(wikidataRowSchema).parse(bank)

  return parsed
}

type PriceBank = {
  rows: readonly QuantityRow[]
  tiers: ReadonlyMap<string, ContentTier>
}

let parsedPrices: PriceBank | null = null

const priceBankOf = (): PriceBank => {
  if (parsedPrices === null) {
    const priced = z.array(pricedRowSchema).parse(priceBank)

    parsedPrices = {
      rows: priced.map(({ source: _, tier: __, ...row }) => ({
        ...row,
        countryCode: null,
        family: 'price.item',
        liesIn: row.homeCountry === null ? [] : [row.homeCountry],
        wellKnownIn: []
      })),
      tiers: new Map(priced.map(({ entity, tier }) => [entity, tier]))
    }
  }

  return parsedPrices
}

/**
 * The question every screen draws for a row of the bank: its outline under a
 * country, its photograph under a mountain, a building, a river or a price.
 */
export const bankQuestionOf = (
  row: QuantityRow
): EstimateQuestion & { kind: 'bank' } => ({
  family: row.family,
  kind: 'bank',
  names: row.names,
  photo: photoOf(row.entity),
  silhouette:
    row.countryCode === null ? null : silhouetteFileOf(row.countryCode)
})

/** Every price of the hand-written bank, as a quantity counted in euros. */
export const bankedPrices = (): readonly QuantityRow[] => priceBankOf().rows

/**
 * Every draw reads the id and the tier of all five thousand rows, and an id
 * built afresh is hashed afresh by the played set: that alone cost a mixed
 * estimate three milliseconds a draw.
 */
const perRow = <TValue>(
  compute: (row: QuantityRow) => TValue
): ((row: QuantityRow) => TValue) => {
  const known = new WeakMap<QuantityRow, TValue>()

  return (row) => {
    const held = known.get(row)

    if (held !== undefined) {
      return held
    }

    const value = compute(row)

    known.set(row, value)

    return value
  }
}

export const playedQuantityId = perRow(
  ({ entity, family }) => `estimate:${family}:${entity}`
)

const tierAt = (country: CountryCode) =>
  perRow((row): ContentTier => {
    if (row.family === 'price.item') {
      return priceBankOf().tiers.get(row.entity) ?? 'hard'
    }

    return isFamousQuantity({
      country,
      entity: row.entity,
      family: row.family,
      names: row.names
    })
      ? 'easy'
      : row.wellKnownIn.includes(country)
        ? 'medium'
        : 'hard'
  })

const tiersByCountry = new Map<CountryCode, (row: QuantityRow) => ContentTier>()

/**
 * A famous quantity is one the table knows by heart, a well-known one one it
 * has heard of, and the rest the height of a summit nobody at the table has —
 * a guess at the zeros, which `easy` never deals while anything else is left.
 * Each country's table is tiered on its own — Guéret is a French table's, and
 * Coimbra a Portuguese one's — and a price's tier is picked by hand for all.
 */
export const tierOfQuantity = ({
  homeCountry,
  row
}: {
  homeCountry: CountryCode | null
  row: QuantityRow
}): ContentTier => {
  const country = homeCountry ?? TIERS_OF_A_TABLE_WITH_NO_COUNTRY
  let tierOf = tiersByCountry.get(country)

  if (tierOf === undefined) {
    tierOf = tierAt(country)
    tiersByCountry.set(country, tierOf)
  }

  return tierOf(row)
}

const estimateRowsByTopic = (): ReadonlyMap<
  QuantityTopic,
  readonly QuantityRow[]
> =>
  Map.groupBy(
    [...bankedQuantities(), ...bankedPrices()],
    ({ family }) => TOPIC_OF_FAMILY[family]
  )

let rowsByTopic: ReadonlyMap<QuantityTopic, readonly QuantityRow[]> | null =
  null

/**
 * A quantity of a topic the table ticked that the room has not been dealt, at
 * the room's level, the topic drawn first: drawn over the rows, two thousand
 * rivers drown two hundred prices. `null` once every ticked topic is spent, because
 * a number heard again is its answer. A table is dealt everyone's rows and its
 * own country's, never another country's.
 */
export const drawQuantity = ({
  difficulty,
  homeCountry,
  playedIds,
  topics
}: {
  difficulty: Difficulty
  homeCountry: CountryCode | null
  playedIds: ReadonlySet<string>
  topics: readonly QuantityTopic[]
}): QuantityRow | null => {
  rowsByTopic ??= estimateRowsByTopic()
  const isDealtHere = isDealtAt(homeCountry)

  for (const topic of shuffled(topics)) {
    const drawn = drawByDifficulty({
      difficulty,
      pool: (rowsByTopic.get(topic) ?? []).filter(
        (row) => isDealtHere(row) && !playedIds.has(playedQuantityId(row))
      ),
      tierOf: (row) => tierOfQuantity({ homeCountry, row })
    })

    if (drawn !== null) {
      return drawn
    }
  }

  return null
}

/**
 * A table with children compares France with Spain and Paris with Lyon:
 * every pair holds a side from the table's own country while one can be
 * paired, and no pair is closer than a child can tell apart. A table with no
 * country of its own has no side to prefer.
 */
const dealPairsForChildrenAt =
  (homeCountry: CountryCode | null) =>
  (rows: readonly QuantityRow[]): DealtPair<QuantityRow>[] | null =>
    dealPairsBy({
      rows,
      rules: {
        band: WIDE_PAIR_BAND,
        prefers: ({ liesIn }) =>
          homeCountry !== null && liesIn.includes(homeCountry)
      }
    })

export const playedPairedQuantityId = perRow(
  ({ entity, family }) => `higherlower:${family}:${entity}`
)

/**
 * A round of quantities the room has not compared, every pair from one tier
 * of the room's level: two summits nobody has heard of are a coin flip, not a
 * comparison, and `easy` deals them only once nothing better can fill a round.
 * `easy` also deals its pairs wider apart and from the table's country first. `null` once
 * the bank cannot deal a round.
 */
export const drawPairs = ({
  difficulty,
  homeCountry,
  playedIds
}: {
  difficulty: Difficulty
  homeCountry: CountryCode | null
  playedIds: ReadonlySet<string>
}): DealtPair<QuantityRow>[] | null => {
  const isDealtHere = isDealtAt(homeCountry)

  return dealByDifficulty({
    deal:
      difficulty === 'easy' ? dealPairsForChildrenAt(homeCountry) : dealPairs,
    difficulty,
    pool: bankedQuantities().filter(
      (row) => isDealtHere(row) && !playedIds.has(playedPairedQuantityId(row))
    ),
    tierOf: (row) => tierOfQuantity({ homeCountry, row })
  })
}
