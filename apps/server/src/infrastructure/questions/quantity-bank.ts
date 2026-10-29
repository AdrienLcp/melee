import { z } from 'zod'

import { quantityFamilySchema } from '@melee/protocol/estimate'

import { pickRandom } from '@melee/core/helpers/random'

import bank from './quantity-bank.json' with { type: 'json' }

export const quantityRowSchema = z.object({
  /** Its Wikidata id, which one place carries into two families — a country's population and its area. */
  entity: z.string(),
  family: quantityFamilySchema,
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
 * A quantity the room has not been dealt, a well-known one first: the height of
 * a summit nobody at the table has heard of is a guess at the zeros, not an
 * estimate. `null` once the whole bank is spent, because a number heard again
 * is its answer.
 */
export const drawQuantity = ({
  playedIds
}: {
  playedIds: ReadonlySet<string>
}): QuantityRow | null => {
  const unplayed = bankedQuantities().filter(
    (row) => !playedIds.has(playedQuantityId(row))
  )

  return (
    pickRandom(unplayed.filter(({ isWellKnown }) => isWellKnown)) ??
    pickRandom(unplayed)
  )
}
