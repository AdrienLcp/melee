import { describe, expect, it } from 'vitest'

import type { Difficulty } from '@melee/protocol/difficulty'

import {
  type ContentTier,
  dealByDifficulty,
  drawByDifficulty
} from './difficulty-draw'

type Row = { id: string; tier: ContentTier }

const rowsOf = (tier: ContentTier, count: number): Row[] =>
  Array.from({ length: count }, (_, index) => ({ id: `${tier}${index}`, tier }))

const tierOf = ({ tier }: Row): ContentTier => tier

const DRAWS = 3_000

const tiersDrawn = ({
  difficulty,
  pool
}: {
  difficulty: Difficulty
  pool: readonly Row[]
}): Map<ContentTier, number> => {
  const counts = new Map<ContentTier, number>()

  for (let draw = 0; draw < DRAWS; draw += 1) {
    const row = drawByDifficulty({ difficulty, pool, tierOf })

    if (row !== null) {
      counts.set(row.tier, (counts.get(row.tier) ?? 0) + 1)
    }
  }

  return counts
}

const shareOf = ({
  counts,
  tier
}: {
  counts: Map<ContentTier, number>
  tier: ContentTier
}): number => (counts.get(tier) ?? 0) / DRAWS

/** Mostly obscure, like the flag bank that made every evening feel hard. */
const SKEWED = [
  ...rowsOf('easy', 5),
  ...rowsOf('medium', 20),
  ...rowsOf('hard', 150)
]

describe('drawByDifficulty', () => {
  it('[difficulty] deals the easy tier alone while one is left', () => {
    expect([
      ...tiersDrawn({ difficulty: 'easy', pool: SKEWED }).keys()
    ]).toEqual(['easy'])
  })

  it('[difficulty] falls from easy to medium before hard', () => {
    const pool = [...rowsOf('medium', 3), ...rowsOf('hard', 30)]

    expect([...tiersDrawn({ difficulty: 'easy', pool }).keys()]).toEqual([
      'medium'
    ])
  })

  it('[difficulty] deals hard and medium, never easy, while either is left', () => {
    const counts = tiersDrawn({ difficulty: 'hard', pool: SKEWED })

    expect(counts.has('easy')).toBe(false)
    expect(counts.has('medium')).toBe(true)
    expect(counts.has('hard')).toBe(true)
  })

  it('[difficulty] falls from hard to easy once nothing harder is left', () => {
    expect(
      drawByDifficulty({
        difficulty: 'hard',
        pool: rowsOf('easy', 2),
        tierOf
      })?.tier
    ).toBe('easy')
  })

  it('[difficulty] mixes a skewed pool a third a tier', () => {
    const counts = tiersDrawn({ difficulty: 'mixed', pool: SKEWED })

    for (const tier of ['easy', 'medium', 'hard'] as const) {
      expect(shareOf({ counts, tier })).toBeCloseTo(1 / 3, 1)
    }
  })

  it('[difficulty] mixes half and half when a tier is empty', () => {
    const counts = tiersDrawn({
      difficulty: 'mixed',
      pool: [...rowsOf('easy', 4), ...rowsOf('hard', 80)]
    })

    expect(shareOf({ counts, tier: 'easy' })).toBeCloseTo(1 / 2, 1)
    expect(shareOf({ counts, tier: 'medium' })).toBe(0)
  })

  it('[difficulty] draws nothing from an empty pool', () => {
    for (const difficulty of ['easy', 'mixed', 'hard'] as const) {
      expect(drawByDifficulty({ difficulty, pool: [], tierOf })).toBeNull()
    }
  })
})

describe('dealByDifficulty', () => {
  const threeOf = (rows: readonly Row[]): readonly Row[] | null =>
    rows.length >= 3 ? rows.slice(0, 3) : null

  it('[difficulty] deals a whole round from one tier', () => {
    const dealt = dealByDifficulty({
      deal: threeOf,
      difficulty: 'mixed',
      pool: SKEWED,
      tierOf
    })

    expect(new Set(dealt?.map(tierOf)).size).toBe(1)
  })

  it('[difficulty] passes over a tier too thin to deal a round', () => {
    const dealt = dealByDifficulty({
      deal: threeOf,
      difficulty: 'easy',
      pool: [...rowsOf('easy', 2), ...rowsOf('medium', 5)],
      tierOf
    })

    expect(dealt?.map(tierOf)).toEqual(['medium', 'medium', 'medium'])
  })
})
