import { z } from 'zod'

import type { Difficulty } from '@melee/protocol/difficulty'
import {
  type QuantityTopic,
  quantityFamilySchema,
  TOPIC_OF_FAMILY,
  wikidataQuantityFamilySchema
} from '@melee/protocol/estimate'

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
import priceBank from './price-bank.json' with { type: 'json' }
import bank from './quantity-bank.json' with { type: 'json' }

export const quantityRowSchema = z.object({
  /** Its Wikidata id, which one place carries into two families — a country's population and its area. */
  entity: z.string(),
  family: quantityFamilySchema,
  /**
   * France itself, or a place Wikidata puts in it — Mont Blanc and the Rhine
   * among them, which are a French table's own however many countries share them.
   */
  isInFrance: z.boolean(),
  /** Whether a French room can be expected to have heard of it, by its article's traffic. */
  isWellKnown: z.boolean(),
  names: z.object({ en: z.string().min(1), fr: z.string().min(1) }),
  /**
   * In the family's unit, rounded to three significant figures: Wikidata's
   * population of Japan is a census figure no table should be paid on to the unit.
   */
  value: z.number().positive()
})

export type QuantityRow = z.infer<typeof quantityRowSchema>

const wikidataRowSchema = quantityRowSchema.extend({
  family: wikidataQuantityFamilySchema
})

/**
 * A price written by hand, worded with its reference — the year, the edition,
 * before tax or not — so the table cannot argue it, and with where it was
 * read so the bank can be audited. Its tier is picked by hand too: no traffic
 * figure says a table knows what a stamp costs and not a Steam Deck.
 */
const pricedRowSchema = z.object({
  entity: z.string(),
  isInFrance: z.boolean(),
  names: z.object({ en: z.string().min(1), fr: z.string().min(1) }),
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
      rows: priced.map(({ source: _, tier, ...row }) => ({
        ...row,
        family: 'price.item',
        isWellKnown: tier !== 'hard'
      })),
      tiers: new Map(priced.map(({ entity, tier }) => [entity, tier]))
    }
  }

  return parsedPrices
}

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

/**
 * A famous quantity is one a French table knows by heart, a well-known one one
 * it has heard of, and the rest the height of a summit nobody at the table has
 * — a guess at the zeros, which `easy` never deals while anything else is left.
 */
export const tierOfQuantity = perRow((row): ContentTier => {
  if (row.family === 'price.item') {
    return priceBankOf().tiers.get(row.entity) ?? 'hard'
  }

  return isFamousQuantity({ family: row.family, names: row.names })
    ? 'easy'
    : row.isWellKnown
      ? 'medium'
      : 'hard'
})

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
 * a number heard again is its answer.
 */
export const drawQuantity = ({
  difficulty,
  playedIds,
  topics
}: {
  difficulty: Difficulty
  playedIds: ReadonlySet<string>
  topics: readonly QuantityTopic[]
}): QuantityRow | null => {
  rowsByTopic ??= estimateRowsByTopic()

  for (const topic of shuffled(topics)) {
    const drawn = drawByDifficulty({
      difficulty,
      pool: (rowsByTopic.get(topic) ?? []).filter(
        (row) => !playedIds.has(playedQuantityId(row))
      ),
      tierOf: tierOfQuantity
    })

    if (drawn !== null) {
      return drawn
    }
  }

  return null
}

/**
 * A table with children compares France with Spain and Paris with Lyon:
 * every pair holds a French side while one can be paired, and no pair is
 * closer than a child can tell apart.
 */
const dealPairsForChildren = (
  rows: readonly QuantityRow[]
): DealtPair<QuantityRow>[] | null =>
  dealPairsBy({
    rows,
    rules: { band: WIDE_PAIR_BAND, prefers: ({ isInFrance }) => isInFrance }
  })

export const playedPairedQuantityId = perRow(
  ({ entity, family }) => `higherlower:${family}:${entity}`
)

/**
 * A round of quantities the room has not compared, every pair from one tier
 * of the room's level: two summits nobody has heard of are a coin flip, not a
 * comparison, and `easy` deals them only once nothing better can fill a round.
 * `easy` also deals its pairs wider apart and from France first. `null` once
 * the bank cannot deal a round.
 */
export const drawPairs = ({
  difficulty,
  playedIds
}: {
  difficulty: Difficulty
  playedIds: ReadonlySet<string>
}): DealtPair<QuantityRow>[] | null =>
  dealByDifficulty({
    deal: difficulty === 'easy' ? dealPairsForChildren : dealPairs,
    difficulty,
    pool: bankedQuantities().filter(
      (row) => !playedIds.has(playedPairedQuantityId(row))
    ),
    tierOf: tierOfQuantity
  })
