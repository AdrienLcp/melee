import { describe, expect, it } from 'vitest'

import { matchsticksGlyphsSchema } from '@melee/protocol/matchsticks'

import { dealPuzzle } from './deal'
import { isTrueEquation, numberValue } from './one-move'

const NOTHING_PLAYED = () => false

describe('a dealt puzzle', () => {
  it('[matchsticks] is a false equation that one stick makes true', () => {
    for (let draw = 0; draw < 200; draw++) {
      const dealt = dealPuzzle({ goal: 'equation', isPlayed: NOTHING_PLAYED })

      expect(dealt).not.toBeNull()
      expect(isTrueEquation(dealt?.puzzle.glyphs ?? '')).toBe(false)
      expect(dealt?.solutions.length).toBeGreaterThan(0)

      for (const solution of dealt?.solutions ?? []) {
        expect(isTrueEquation(solution.glyphs)).toBe(true)
      }
    }
  })

  it('[matchsticks] is a number one stick makes bigger', () => {
    for (let draw = 0; draw < 200; draw++) {
      const dealt = dealPuzzle({ goal: 'biggest', isPlayed: NOTHING_PLAYED })
      const original = numberValue(dealt?.puzzle.glyphs ?? '') ?? 0

      for (const solution of dealt?.solutions ?? []) {
        expect(numberValue(solution.glyphs)).toBeGreaterThan(original)
      }

      expect(dealt?.solutions.length).toBeGreaterThan(0)
    }
  })

  it('[matchsticks] is a number one stick makes smaller', () => {
    for (let draw = 0; draw < 200; draw++) {
      const dealt = dealPuzzle({ goal: 'smallest', isPlayed: NOTHING_PLAYED })
      const original = numberValue(dealt?.puzzle.glyphs ?? '') ?? 0

      for (const solution of dealt?.solutions ?? []) {
        expect(numberValue(solution.glyphs)).toBeLessThan(original)
      }

      expect(dealt?.solutions.length).toBeGreaterThan(0)
    }
  })

  it('[matchsticks] is a puzzle the wire accepts', () => {
    for (const goal of ['equation', 'biggest', 'smallest'] as const) {
      const dealt = dealPuzzle({ goal, isPlayed: NOTHING_PLAYED })

      expect(
        matchsticksGlyphsSchema.safeParse(dealt?.puzzle.glyphs).success
      ).toBe(true)
    }
  })

  it('[matchsticks] is never one the room was already dealt', () => {
    const played = new Set<string>()

    for (let draw = 0; draw < 30; draw++) {
      const dealt = dealPuzzle({
        goal: 'equation',
        isPlayed: (glyphs) => played.has(glyphs)
      })

      expect(played.has(dealt?.puzzle.glyphs ?? '')).toBe(false)
      played.add(dealt?.puzzle.glyphs ?? '')
    }
  })
})
