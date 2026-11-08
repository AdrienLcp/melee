import { describe, expect, it } from 'vitest'

import type { ContentTier } from '../round/difficulty-draw'
import { blackSquareTierQuotas, dealBlackSquareAnswers } from './answer-deal'

const poolOf = (counts: Partial<Record<ContentTier, number>>) =>
  (['easy', 'medium', 'hard'] as const).flatMap((tier) =>
    Array.from({ length: counts[tier] ?? 0 }, (_, index) => ({
      name: `${tier}-${index}`,
      tier
    }))
  )

const tiersOf = (dealt: readonly { tier: ContentTier }[]) =>
  dealt.map(({ tier }) => tier)

describe('dealing a black-square round from a pool', () => {
  it('[blacksquare] deals four cells one easy, two medium and one hard', () => {
    const dealt = dealBlackSquareAnswers({
      count: 4,
      pool: poolOf({ easy: 5, hard: 5, medium: 5 })
    })

    expect(tiersOf(dealt)).toEqual(['easy', 'medium', 'medium', 'hard'])
  })

  it('[blacksquare] keeps the same proportions at every count', () => {
    expect(
      [3, 4, 5, 6, 9].map((count) => blackSquareTierQuotas(count))
    ).toEqual([
      { easy: 1, hard: 1, medium: 1 },
      { easy: 1, hard: 1, medium: 2 },
      { easy: 1, hard: 1, medium: 3 },
      { easy: 2, hard: 2, medium: 2 },
      { easy: 2, hard: 2, medium: 5 }
    ])
  })

  it('[blacksquare] deals each answer once, from the pool', () => {
    const pool = poolOf({ easy: 3, hard: 3, medium: 3 })
    const dealt = dealBlackSquareAnswers({ count: 9, pool })

    expect(new Set(dealt).size).toBe(9)
    expect(dealt.every((answer) => pool.includes(answer))).toBe(true)
  })

  it('[blacksquare] falls through to the nearest tier when one runs short', () => {
    expect(
      tiersOf(
        dealBlackSquareAnswers({
          count: 4,
          pool: poolOf({ easy: 4, medium: 4 })
        })
      )
    ).toEqual(['easy', 'medium', 'medium', 'medium'])
    expect(
      tiersOf(
        dealBlackSquareAnswers({ count: 4, pool: poolOf({ easy: 4, hard: 4 }) })
      )
    ).toEqual(['easy', 'easy', 'easy', 'hard'])
  })

  it('[blacksquare] deals a theme again with different answers', () => {
    const pool = poolOf({ easy: 4, hard: 4, medium: 8 })
    const deals = new Set(
      Array.from({ length: 20 }, () =>
        dealBlackSquareAnswers({ count: 4, pool })
          .map(({ name }) => name)
          .join()
      )
    )

    expect(deals.size).toBeGreaterThan(1)
  })
})
