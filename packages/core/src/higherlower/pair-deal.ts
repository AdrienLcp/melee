import type { QuantityFamily } from '@melee/protocol/estimate'
import {
  HIGHER_LOWER_PAIR_COUNT,
  type HigherLowerSide
} from '@melee/protocol/higher-lower'

import { shuffled } from '../helpers/random'

/** What a pair is dealt from: one row of the quantity bank, as much of it as the rules read. */
export type ComparableQuantity = {
  entity: string
  family: QuantityFamily
  value: number
}

/**
 * Two values closer than this decide nothing a table can know: a rounding of
 * the bank's three significant figures could flip them.
 */
export const MIN_PAIR_RATIO = 1.15

/** Two values further apart than this are answered by the names alone. */
export const MAX_PAIR_RATIO = 4

/** A round of five pairs from one or two families is a theme, not a mix; a round of one is its own family. */
export const MIN_FAMILIES_PER_ROUND = Math.min(3, HIGHER_LOWER_PAIR_COUNT)

export type DealtPair<TRow extends ComparableQuantity> = {
  left: TRow
  right: TRow
}

const isFairPair = ({
  one,
  other
}: {
  one: number
  other: number
}): boolean => {
  const ratio = Math.max(one, other) / Math.min(one, other)

  return ratio >= MIN_PAIR_RATIO && ratio <= MAX_PAIR_RATIO
}

export const higherSideOf = ({
  left,
  right
}: {
  left: Pick<ComparableQuantity, 'value'>
  right: Pick<ComparableQuantity, 'value'>
}): HigherLowerSide => (left.value > right.value ? 'left' : 'right')

const pairIn = <TRow extends ComparableQuantity>({
  rows,
  usedEntities
}: {
  rows: readonly TRow[]
  usedEntities: ReadonlySet<string>
}): DealtPair<TRow> | null => {
  const free = shuffled(rows.filter(({ entity }) => !usedEntities.has(entity)))

  for (const [index, one] of free.entries()) {
    const other = free
      .slice(index + 1)
      .find(
        (candidate) =>
          candidate.entity !== one.entity &&
          isFairPair({ one: one.value, other: candidate.value })
      )

    if (other !== undefined) {
      const [left, right] = shuffled([one, other])

      return left === undefined || right === undefined ? null : { left, right }
    }
  }

  return null
}

/**
 * A round of pairs, each two rows of one family a fair comparison apart, from
 * as many families as it holds pairs up to three, and never one entity twice — a country's population
 * and its area are one place. Which side is higher is the shuffle's, never
 * the bigger one on the left. `null` when the rows left cannot deal a round.
 */
export const dealPairs = <TRow extends ComparableQuantity>(
  rows: readonly TRow[]
): DealtPair<TRow>[] | null => {
  const byFamily = Map.groupBy(rows, ({ family }) => family)
  const families = shuffled([...byFamily.keys()])
  const usedEntities = new Set<string>()
  const pairs: DealtPair<TRow>[] = []
  const familiesDealt = new Set<QuantityFamily>()

  const take = (family: QuantityFamily): void => {
    const pair = pairIn({ rows: byFamily.get(family) ?? [], usedEntities })

    if (pair !== null) {
      pairs.push(pair)
      familiesDealt.add(family)
      usedEntities.add(pair.left.entity)
      usedEntities.add(pair.right.entity)
    }
  }

  // One pair a family first, so a round mixes as many as it can, then a
  // second from any family that still has rows to give.
  for (const family of [...families, ...families]) {
    if (pairs.length < HIGHER_LOWER_PAIR_COUNT) {
      take(family)
    }
  }

  return pairs.length === HIGHER_LOWER_PAIR_COUNT &&
    familiesDealt.size >= MIN_FAMILIES_PER_ROUND
    ? shuffled(pairs)
    : null
}
