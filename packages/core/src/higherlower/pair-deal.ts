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

/** How far apart two values of a pair may be, as the larger over the smaller. */
export type PairRatioBand = { max: number; min: number }

export const FAIR_PAIR_BAND: PairRatioBand = {
  max: MAX_PAIR_RATIO,
  min: MIN_PAIR_RATIO
}

/**
 * For a table with children: one and a half times is the closest a child can
 * still tell apart without it being a coin flip, and ten times keeps a pair a
 * question rather than a joke — Paris against Brest is not one.
 */
export const WIDE_PAIR_BAND: PairRatioBand = { max: 10, min: 1.5 }

/** A round of five pairs from one or two families is a theme, not a mix; a round of one is its own family. */
export const MIN_FAMILIES_PER_ROUND = Math.min(3, HIGHER_LOWER_PAIR_COUNT)

export type DealtPair<TRow extends ComparableQuantity> = {
  left: TRow
  right: TRow
}

const isWithinBand = ({
  band,
  one,
  other
}: {
  band: PairRatioBand
  one: number
  other: number
}): boolean => {
  const ratio = Math.max(one, other) / Math.min(one, other)

  return ratio >= band.min && ratio <= band.max
}

export const higherSideOf = ({
  left,
  right
}: {
  left: Pick<ComparableQuantity, 'value'>
  right: Pick<ComparableQuantity, 'value'>
}): HigherLowerSide => (left.value > right.value ? 'left' : 'right')

type PairRules<TRow extends ComparableQuantity> = {
  band: PairRatioBand
  /** Rows a pair holds on one side whenever one of them can be paired at all. */
  prefers?: (row: TRow) => boolean
}

/** Preferred rows first, so each is tried before any pair that holds none. */
const preferredFirst = <TRow extends ComparableQuantity>({
  prefers,
  rows
}: {
  prefers: ((row: TRow) => boolean) | undefined
  rows: readonly TRow[]
}): readonly TRow[] =>
  prefers === undefined
    ? rows
    : [
        ...rows.filter((row) => prefers(row)),
        ...rows.filter((row) => !prefers(row))
      ]

const pairIn = <TRow extends ComparableQuantity>({
  isPreferredOnly,
  rows,
  rules,
  usedEntities
}: {
  /** Whether a pair holding no preferred row is refused rather than dealt. */
  isPreferredOnly: boolean
  rows: readonly TRow[]
  rules: PairRules<TRow>
  usedEntities: ReadonlySet<string>
}): DealtPair<TRow> | null => {
  const free = preferredFirst({
    prefers: rules.prefers,
    rows: shuffled(rows.filter(({ entity }) => !usedEntities.has(entity)))
  })

  for (const [index, one] of free.entries()) {
    if (isPreferredOnly && rules.prefers?.(one) !== true) {
      return null
    }

    const other = free.slice(index + 1).find(
      (candidate) =>
        candidate.entity !== one.entity &&
        isWithinBand({
          band: rules.band,
          one: one.value,
          other: candidate.value
        })
    )

    if (other !== undefined) {
      const [left, right] = shuffled([one, other])

      return left === undefined || right === undefined ? null : { left, right }
    }
  }

  return null
}

/**
 * A round of pairs, each two rows of one family inside the band, from as many
 * families as it holds pairs up to three, and never one entity twice — a
 * country's population and its area are one place. Which side is higher is
 * the shuffle's, never the bigger one on the left. `null` when the rows left
 * cannot deal a round.
 */
export const dealPairsBy = <TRow extends ComparableQuantity>({
  rows,
  rules
}: {
  rows: readonly TRow[]
  rules: PairRules<TRow>
}): DealtPair<TRow>[] | null => {
  const byFamily = Map.groupBy(rows, ({ family }) => family)
  const families = shuffled([...byFamily.keys()])
  const usedEntities = new Set<string>()
  const pairs: DealtPair<TRow>[] = []
  const familiesDealt = new Set<QuantityFamily>()

  const take = ({
    family,
    isPreferredOnly
  }: {
    family: QuantityFamily
    isPreferredOnly: boolean
  }): void => {
    const pair = pairIn({
      isPreferredOnly,
      rows: byFamily.get(family) ?? [],
      rules,
      usedEntities
    })

    if (pair !== null) {
      pairs.push(pair)
      familiesDealt.add(family)
      usedEntities.add(pair.left.entity)
      usedEntities.add(pair.right.entity)
    }
  }

  // Pairs holding a preferred row first, from whichever family has one, and
  // only then any pair. Inside each pass, one pair a family first, so a round
  // mixes as many as it can, then a second from any family with rows to give.
  const passes = rules.prefers === undefined ? [false] : [true, false]

  for (const isPreferredOnly of passes) {
    for (const family of [...families, ...families]) {
      if (pairs.length < HIGHER_LOWER_PAIR_COUNT) {
        take({ family, isPreferredOnly })
      }
    }
  }

  return pairs.length === HIGHER_LOWER_PAIR_COUNT &&
    familiesDealt.size >= MIN_FAMILIES_PER_ROUND
    ? shuffled(pairs)
    : null
}

/** A round of pairs a fair comparison apart, whatever the rows. */
export const dealPairs = <TRow extends ComparableQuantity>(
  rows: readonly TRow[]
): DealtPair<TRow>[] | null =>
  dealPairsBy({ rows, rules: { band: FAIR_PAIR_BAND } })
