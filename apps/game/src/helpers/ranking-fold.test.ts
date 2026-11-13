import { describe, expect, it } from 'vitest'

import { rankingFold } from './ranking-fold'

const sum = (tracks: readonly number[]): number =>
  tracks.reduce((total, track) => total + track, 0)

describe('rankingFold', () => {
  it('[ranking] keeps every calculation while the height holds them', () => {
    const fold = rankingFold({
      canSplit: false,
      ceilingRowPx: 56,
      count: 6,
      floorRowPx: 28,
      height: 800,
      stepLinesFor: () => [1, 1, 1, 1, 1, 1]
    })

    expect(fold.columns).toBe(1)
    expect(fold.fullCount).toBe(6)
    expect(sum(fold.heights)).toBeLessThanOrEqual(800.5)
  })

  it('[ranking] folds the furthest rows first, never past the box', () => {
    const fold = rankingFold({
      canSplit: false,
      ceilingRowPx: 56,
      count: 24,
      floorRowPx: 28,
      height: 800,
      stepLinesFor: () => Array.from({ length: 24 }, () => 1)
    })

    expect(fold.fullCount).toBeGreaterThan(0)
    expect(fold.fullCount).toBeLessThan(24)
    expect(sum(fold.heights)).toBeLessThanOrEqual(800.5)
    expect(fold.heights[0]).toBeGreaterThan(fold.heights.at(-1) ?? 0)
  })

  it('[ranking] takes two columns where that keeps more calculations', () => {
    const fold = rankingFold({
      canSplit: true,
      ceilingRowPx: 56,
      count: 24,
      floorRowPx: 28,
      height: 600,
      stepLinesFor: () => Array.from({ length: 24 }, () => 1)
    })

    expect(fold.columns).toBe(2)
    expect(sum(fold.heights)).toBeLessThanOrEqual(1200.5)
  })

  it('[ranking] takes two columns under the floor rather than squeeze one', () => {
    const fold = rankingFold({
      canSplit: true,
      ceilingRowPx: 56,
      count: 24,
      floorRowPx: 20,
      height: 200,
      stepLinesFor: () => Array.from({ length: 24 }, () => 1)
    })

    expect(fold.fullCount).toBe(0)
    expect(fold.columns).toBe(2)
    expect(fold.rowPx).toBeCloseTo(200 / 12, 1)
  })

  it('[ranking] shares the box at the floor when nothing can keep its calculation', () => {
    const fold = rankingFold({
      canSplit: false,
      ceilingRowPx: 56,
      count: 24,
      floorRowPx: 28,
      height: 400,
      stepLinesFor: () => Array.from({ length: 24 }, () => 1)
    })

    expect(fold.fullCount).toBe(0)
    expect(sum(fold.heights)).toBeCloseTo(400, 0)
  })
})
