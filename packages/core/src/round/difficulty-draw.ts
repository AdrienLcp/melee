import type { Difficulty } from '@melee/protocol/difficulty'

import { pickRandom, shuffled } from '../helpers/random'

export const contentTiers = ['easy', 'medium', 'hard'] as const

/** How hard one dealt item is, as its bank says. Never on the wire: a level is what a room picks. */
export type ContentTier = (typeof contentTiers)[number]

/**
 * Nearest first: `easy` falls to `medium` before `hard`, and `hard` falls to
 * `easy` only once nothing harder is left.
 */
const TIER_GROUPS_BY_LEVEL: Readonly<
  Record<Exclude<Difficulty, 'mixed'>, readonly (readonly ContentTier[])[]>
> = {
  easy: [['easy'], ['medium'], ['hard']],
  hard: [['medium', 'hard'], ['easy']]
}

/**
 * `mixed` tries the tiers in a random order, which picks uniformly among the
 * tiers that can still deal: a bank with no medium row mixes easy and hard
 * half and half.
 */
const tierGroupsFor = (
  difficulty: Difficulty
): readonly (readonly ContentTier[])[] =>
  difficulty === 'mixed'
    ? shuffled(contentTiers.map((tier) => [tier]))
    : TIER_GROUPS_BY_LEVEL[difficulty]

/**
 * What `deal` makes of the first group of tiers the level allows that it can
 * deal from, or `null` once no group can — a level never stalls a deal while
 * the pool could serve it.
 *
 * - `easy` deals the easy tier alone: a table with children.
 * - `mixed` draws a tier uniformly, then deals inside it. A draw uniform over
 *   the items is not a mix: two thirds of the flag bank are obscure.
 * - `hard` deals medium and hard together, never easy.
 *
 * `deal` is handed one tier's share of the pool, so a round of several items —
 * five pairs, five events — is dealt from a single tier.
 */
export const dealByDifficulty = <TItem, TDealt>({
  deal,
  difficulty,
  pool,
  tierOf
}: {
  deal: (items: readonly TItem[]) => TDealt | null
  difficulty: Difficulty
  pool: readonly TItem[]
  tierOf: (item: TItem) => ContentTier
}): TDealt | null => {
  for (const group of tierGroupsFor(difficulty)) {
    const share = pool.filter((item) => group.includes(tierOf(item)))
    const dealt = share.length === 0 ? null : deal(share)

    if (dealt !== null) {
      return dealt
    }
  }

  return null
}

/** One item of the pool at the room's level, or `null` for an empty pool. */
export const drawByDifficulty = <TItem>({
  difficulty,
  pool,
  tierOf
}: {
  difficulty: Difficulty
  pool: readonly TItem[]
  tierOf: (item: TItem) => ContentTier
}): TItem | null =>
  dealByDifficulty({ deal: pickRandom, difficulty, pool, tierOf })

/**
 * The tier of every row of a bank that holds no tiers yet: each level falls
 * through to the one tier there is, so the level deals what the bank always did.
 */
export const oneTierForEveryRow = (): ContentTier => 'medium'
