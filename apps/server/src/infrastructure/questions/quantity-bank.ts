import { z } from 'zod'

import type { Difficulty } from '@melee/protocol/difficulty'
import { quantityFamilySchema } from '@melee/protocol/estimate'

import {
  type DealtPair,
  dealPairs,
  dealPairsBy,
  WIDE_PAIR_BAND
} from '@melee/core/higherlower/pair-deal'
import {
  type ContentTier,
  dealByDifficulty,
  drawByDifficulty
} from '@melee/core/round/difficulty-draw'

import { isFamousQuantity } from './famous-quantities'
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

/** Parsed on the first read, like the other banks, rather than on every cold start. */
let parsed: readonly QuantityRow[] | null = null

/** Every quantity an estimate or a pair of them is dealt from. */
export const bankedQuantities = (): readonly QuantityRow[] => {
  parsed ??= z.array(quantityRowSchema).parse(bank)

  return parsed
}

export const playedQuantityId = ({ entity, family }: QuantityRow): string =>
  `estimate:${family}:${entity}`

/**
 * A famous quantity is one a French table knows by heart, a well-known one one
 * it has heard of, and the rest the height of a summit nobody at the table has
 * — a guess at the zeros, which `easy` never deals while anything else is left.
 */
export const tierOfQuantity = (row: QuantityRow): ContentTier =>
  isFamousQuantity(row) ? 'easy' : row.isWellKnown ? 'medium' : 'hard'

/**
 * A quantity the room has not been dealt, at the room's level. `null` once the
 * whole bank is spent, because a number heard again is its answer.
 */
export const drawQuantity = ({
  difficulty,
  playedIds
}: {
  difficulty: Difficulty
  playedIds: ReadonlySet<string>
}): QuantityRow | null =>
  drawByDifficulty({
    difficulty,
    pool: bankedQuantities().filter(
      (row) => !playedIds.has(playedQuantityId(row))
    ),
    tierOf: tierOfQuantity
  })

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

export const playedPairedQuantityId = ({
  entity,
  family
}: QuantityRow): string => `higherlower:${family}:${entity}`

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
