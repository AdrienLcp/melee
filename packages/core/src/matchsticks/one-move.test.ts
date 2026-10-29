import { describe, expect, it } from 'vitest'

import { stickSlots } from '@melee/protocol/matchsticks'

import { emptyPlacesOf, sticksOf } from './glyphs'
import {
  applyMove,
  isPlayableMove,
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

/** Every pair of stick places a puzzle has, legal or not. */
const everyPlacePairOf = (glyphs: string) => {
  const places = [...glyphs].flatMap((_, glyphIndex) =>
    stickSlots.map((slot) => ({ glyphIndex, slot }))
  )

  return places.flatMap((from) => places.map((to) => ({ from, to })))
}

describe('a move sent by a screen', () => {
  it('[matchsticks] accepts every move the solver makes, and makes the same puzzle of it', () => {
    for (const glyphs of ['6+4=4', '508', '9-7=2', '19']) {
      for (const moved of oneStickMoves(glyphs)) {
        expect(applyMove({ glyphs, move: moved.move })).toBe(moved.glyphs)
      }
    }
  })

  it('[matchsticks] refuses every move the solver would not make', () => {
    for (const glyphs of ['6+4=4', '508']) {
      const made = new Set(
        oneStickMoves(glyphs).map(({ move }) => JSON.stringify(move))
      )

      for (const move of everyPlacePairOf(glyphs)) {
        if (!made.has(JSON.stringify(move))) {
          expect(applyMove({ glyphs, move })).toBeNull()
        }
      }
    }
  })

  it('[matchsticks] refuses a stick lifted where there is none, or laid where there is one', () => {
    const glyphs = '6+4=4'

    expect(
      applyMove({
        glyphs,
        move: {
          from: { glyphIndex: 0, slot: 'b' },
          to: { glyphIndex: 2, slot: 'a' }
        }
      })
    ).toBeNull()
    expect(
      applyMove({
        glyphs,
        move: {
          from: { glyphIndex: 0, slot: 'a' },
          to: { glyphIndex: 2, slot: 'b' }
        }
      })
    ).toBeNull()
    expect(
      applyMove({
        glyphs,
        move: {
          from: { glyphIndex: 9, slot: 'a' },
          to: { glyphIndex: 2, slot: 'a' }
        }
      })
    ).toBeNull()
  })

  it('[matchsticks] plays any stick onto any empty place, whatever the sticks then read as', () => {
    for (const glyphs of ['6+4=4', '508', '1']) {
      const chars = [...glyphs]
      const lifts = chars.flatMap((glyph, glyphIndex) =>
        sticksOf(glyph).map((slot) => ({ glyphIndex, slot }))
      )
      const lays = chars.flatMap((glyph, glyphIndex) =>
        emptyPlacesOf(glyph).map((slot) => ({ glyphIndex, slot }))
      )

      for (const from of lifts) {
        for (const to of lays) {
          expect(isPlayableMove({ glyphs, move: { from, to } })).toBe(true)
        }
      }
    }
    expect(
      applyMove({
        glyphs: '1',
        move: {
          from: { glyphIndex: 0, slot: 'b' },
          to: { glyphIndex: 0, slot: 'g' }
        }
      })
    ).toBeNull()
  })

  it('[matchsticks] plays no stick lifted where there is none, or laid where there is one', () => {
    const glyphs = '6+4=4'

    expect(
      isPlayableMove({
        glyphs,
        move: {
          from: { glyphIndex: 0, slot: 'b' },
          to: { glyphIndex: 2, slot: 'a' }
        }
      })
    ).toBe(false)
    expect(
      isPlayableMove({
        glyphs,
        move: {
          from: { glyphIndex: 0, slot: 'a' },
          to: { glyphIndex: 2, slot: 'b' }
        }
      })
    ).toBe(false)
    expect(
      isPlayableMove({
        glyphs,
        move: {
          from: { glyphIndex: 3, slot: 'h' },
          to: { glyphIndex: 1, slot: 'v' }
        }
      })
    ).toBe(false)
  })

  it('[matchsticks] reads nothing from a move that leaves a glyph that is no digit', () => {
    expect(
      applyMove({
        glyphs: '1',
        move: {
          from: { glyphIndex: 0, slot: 'b' },
          to: { glyphIndex: 0, slot: 'a' }
        }
      })
    ).toBeNull()
  })

  it('[matchsticks] turns the tail of a 6 into the top of a 9', () => {
    expect(
      applyMove({
        glyphs: '6+4=4',
        move: {
          from: { glyphIndex: 0, slot: 'e' },
          to: { glyphIndex: 0, slot: 'b' }
        }
      })
    ).toBe('9+4=4')
  })
})
