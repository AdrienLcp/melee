import type { BlackSquareTier } from '@melee/protocol/black-square'

import { shuffled } from '../helpers/random'
import { type ContentTier, contentTiers } from '../round/difficulty-draw'

/** What a dealt answer weighs on the sheet: a rare one three times an obvious one. */
export const BLACK_SQUARE_WEIGHT_BY_TIER: Readonly<
  Record<ContentTier, BlackSquareTier>
> = { easy: 1, hard: 3, medium: 2 }

/** Nearest first: a cell short of a medium answer takes an easy one before a rare one. */
const FALL_THROUGH: Readonly<Record<ContentTier, readonly ContentTier[]>> = {
  easy: ['easy', 'medium', 'hard'],
  hard: ['hard', 'medium', 'easy'],
  medium: ['medium', 'easy', 'hard']
}

/**
 * How many cells of each tier a round deals: a quarter obvious, a quarter
 * rare, the rest between — four cells are 1, 2 and 1, nine are 2, 5 and 2.
 */
export const blackSquareTierQuotas = (
  count: number
): Record<ContentTier, number> => {
  const edge = Math.round(count / 4)

  return { easy: edge, hard: edge, medium: count - 2 * edge }
}

/**
 * `count` answers of a theme's pool, obvious first. Stratified rather than
 * uniform: a uniform draw over fifteen answers often deals four obvious ones
 * or four obscure ones. A tier the pool runs short of takes from the nearest
 * one, and an answer dealt in its place keeps its own tier — and its own pay.
 */
export const dealBlackSquareAnswers = <TAnswer extends { tier: ContentTier }>({
  count,
  pool
}: {
  count: number
  pool: readonly TAnswer[]
}): TAnswer[] => {
  const left = new Map(
    contentTiers.map((tier) => [
      tier,
      shuffled(pool.filter((answer) => answer.tier === tier))
    ])
  )
  const quotas = blackSquareTierQuotas(count)
  const takeFor = (tier: ContentTier): TAnswer | undefined => {
    const from = FALL_THROUGH[tier].find(
      (each) => (left.get(each)?.length ?? 0) > 0
    )

    return from === undefined ? undefined : left.get(from)?.shift()
  }

  return contentTiers
    .flatMap((tier) =>
      Array.from({ length: quotas[tier] }, () => takeFor(tier))
    )
    .filter((answer) => answer !== undefined)
    .toSorted(
      (left, right) =>
        BLACK_SQUARE_WEIGHT_BY_TIER[left.tier] -
        BLACK_SQUARE_WEIGHT_BY_TIER[right.tier]
    )
}
