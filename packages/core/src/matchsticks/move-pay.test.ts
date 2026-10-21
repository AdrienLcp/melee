import { describe, expect, it } from 'vitest'

import type { MatchsticksPuzzle } from '@melee/protocol/matchsticks'
import { POINT } from '@melee/protocol/scoring'

import { isBestMove, placesFromBestOf, pointsForMove } from './move-pay'

const placeOf = (puzzle: MatchsticksPuzzle, made: string) =>
  placesFromBestOf({ made, puzzle })

const BIGGEST: MatchsticksPuzzle = { glyphs: '508', goal: 'biggest' }
const SMALLEST: MatchsticksPuzzle = { glyphs: '19', goal: 'smallest' }

describe('where a move lands among the answers', () => {
  it('[matchsticks] places the biggest number one stick makes first, and the next ones after it', () => {
    expect(placeOf(BIGGEST, '909')).toBe(0)
    expect(placeOf(BIGGEST, '906')).toBe(1)
    expect(placeOf(BIGGEST, '900')).toBe(2)
    expect(placeOf(BIGGEST, '609')).toBe(3)
  })

  it('[matchsticks] places the smallest number first on a smallest-number puzzle', () => {
    expect(placeOf(SMALLEST, '10')).toBe(0)
    expect(placeOf(SMALLEST, '16')).toBe(1)
  })

  it('[matchsticks] places nothing that does not improve on the number dealt', () => {
    expect(placeOf(SMALLEST, '75')).toBeNull()
    expect(placeOf({ glyphs: '508', goal: 'smallest' }, '568')).toBeNull()
  })

  it('[matchsticks] places nothing that is not a number', () => {
    expect(placeOf(BIGGEST, '058')).toBeNull()
  })

  it('[matchsticks] places a true equation first and a false one nowhere', () => {
    const puzzle: MatchsticksPuzzle = { glyphs: '6+4=4', goal: 'equation' }

    expect(placeOf(puzzle, '0+4=4')).toBe(0)
    expect(placeOf(puzzle, '8-4=4')).toBe(0)
    expect(placeOf(puzzle, '9+4=4')).toBeNull()
  })
})

describe('what a move earns', () => {
  it('[matchsticks] pays the typed answer’s price for the best move', () => {
    expect(pointsForMove({ placesFromBest: 0 })).toBe(3 * POINT)
    expect(isBestMove({ placesFromBest: 0 })).toBe(true)
  })

  it('[matchsticks] still pays the next two answers, less the further they are', () => {
    expect(pointsForMove({ placesFromBest: 1 })).toBe(2 * POINT)
    expect(pointsForMove({ placesFromBest: 2 })).toBe(POINT)
    expect(isBestMove({ placesFromBest: 1 })).toBe(false)
  })

  it('[matchsticks] pays nothing further down, nor for a move that answers nothing', () => {
    expect(pointsForMove({ placesFromBest: 3 })).toBe(0)
    expect(pointsForMove({ placesFromBest: null })).toBe(0)
    expect(isBestMove({ placesFromBest: null })).toBe(false)
  })
})
