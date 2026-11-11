import { describe, expect, it } from 'vitest'

import { indexForms } from './longest-words'
import {
  drawPlayableLetters,
  LONGEST_WORD_FLOOR,
  MOST_DRAW_ATTEMPTS
} from './playable-draw'

const INDEX = indexForms(
  new Map([
    [6, ['PIRATE']],
    [7, ['PARTIES', 'PIASTRE', 'TRAIPSE']]
  ])
)

const NO_SEVEN = ['P', 'I', 'R', 'A', 'T', 'E', 'B', 'C', 'D']
const A_SEVEN = ['P', 'I', 'R', 'A', 'T', 'E', 'S', 'C', 'D']

const drawsInTurn = (draws: readonly string[][]) => {
  let next = 0

  return () => {
    const draw = draws[next % draws.length] ?? []

    next++

    return draw
  }
}

describe('drawPlayableLetters', () => {
  it('[longestword] redraws until the dictionary holds a word of seven letters or more from the draw', () => {
    expect(LONGEST_WORD_FLOOR).toBe(7)
    expect(
      drawPlayableLetters({
        draw: drawsInTurn([NO_SEVEN, NO_SEVEN, A_SEVEN]),
        index: INDEX,
        language: 'en'
      })
    ).toEqual({
      bestLength: 7,
      bestWords: ['PARTIES', 'PIASTRE', 'TRAIPSE'],
      letters: A_SEVEN
    })
  })

  it('[longestword] gives up on a dictionary that never holds a long enough word', () => {
    let draws = 0

    expect(
      drawPlayableLetters({
        draw: () => {
          draws++

          return NO_SEVEN
        },
        index: INDEX,
        language: 'en'
      })
    ).toBeNull()
    expect(draws).toBe(MOST_DRAW_ATTEMPTS)
  })
})
