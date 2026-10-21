import { describe, expect, it } from 'vitest'

import { sticksOf } from './glyphs'
import {
  isTrueEquation,
  numberValue,
  oneStickMoves,
  solutionsOf
} from './one-move'

const stickCount = (glyphs: string): number =>
  [...glyphs].reduce((total, glyph) => total + sticksOf(glyph).length, 0)

const answersOf = (
  glyphs: string,
  goal: 'biggest' | 'equation' | 'smallest'
) => [
  ...new Set(solutionsOf({ glyphs, goal }).map((solution) => solution.glyphs))
]

describe('one stick moved', () => {
  it('[matchsticks] keeps every stick and every glyph', () => {
    for (const moved of oneStickMoves('6+4=4')) {
      expect(moved.glyphs).toHaveLength(5)
      expect(stickCount(moved.glyphs)).toBe(stickCount('6+4=4'))
    }
  })

  it('[matchsticks] turns a 6 into a 9 on its own glyph', () => {
    expect(oneStickMoves('6').map((moved) => moved.glyphs)).toContain('9')
  })

  it('[matchsticks] never lifts a stick off the equals sign', () => {
    for (const moved of oneStickMoves('1+1=2')) {
      expect(moved.glyphs.split('=')).toHaveLength(2)
      expect(moved.move.from.glyphIndex).not.toBe(3)
      expect(moved.move.to.glyphIndex).not.toBe(3)
    }
  })
})

describe('an equation', () => {
  it('[matchsticks] reads plus and minus left to right', () => {
    expect(isTrueEquation('9-4+1=6')).toBe(true)
    expect(isTrueEquation('6+4=4')).toBe(false)
    expect(isTrueEquation('6+4')).toBe(false)
  })

  it('[matchsticks] refuses a number written with a zero in front', () => {
    expect(numberValue('08')).toBeNull()
    expect(isTrueEquation('08-0=8')).toBe(false)
  })

  it('[matchsticks] solves the puzzles a table already knows', () => {
    expect(answersOf('6+4=4', 'equation')).toContain('0+4=4')
    expect(answersOf('5+7=2', 'equation')).toContain('9-7=2')
    expect(answersOf('3+3=8', 'equation')).toContain('5+3=8')
  })

  it('[matchsticks] has no answer when no stick makes it true', () => {
    expect(answersOf('1+1=8', 'equation')).toEqual([])
  })
})

describe('the biggest and the smallest number', () => {
  it('[matchsticks] moves the stick that makes the biggest number', () => {
    expect(answersOf('508', 'biggest')).toEqual(['909'])
  })

  it('[matchsticks] moves the stick that makes the smallest number', () => {
    expect(answersOf('508', 'smallest')).toEqual(['308'])
  })

  it('[matchsticks] has no answer when no stick improves the number', () => {
    expect(answersOf('1', 'biggest')).toEqual([])
  })
})
