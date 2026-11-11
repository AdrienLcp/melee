import { describe, expect, it } from 'vitest'

import {
  bestMarkByLetter,
  foundOnTryOf,
  isGridDone,
  mostPlacedOf
} from './grid-reading'

describe('bestMarkByLetter', () => {
  it('[mysteryword] keeps the best mark a letter has shown over every try', () => {
    const best = bestMarkByLetter([
      {
        marks: ['placed', 'present', 'absent', 'absent', 'absent'],
        word: 'PARLE'
      },
      {
        marks: ['placed', 'absent', 'placed', 'absent', 'absent'],
        word: 'PIANO'
      }
    ])

    expect(best.get('A')).toBe('placed')
    expect(best.get('R')).toBe('absent')
    expect(best.get('P')).toBe('placed')
    expect(best.has('Z')).toBe(false)
  })

  it('[mysteryword] never lowers a letter shown in place by a later absent copy', () => {
    const best = bestMarkByLetter([
      {
        marks: ['placed', 'absent', 'absent', 'absent', 'placed'],
        word: 'TASTE'
      },
      {
        marks: ['placed', 'absent', 'absent', 'absent', 'absent'],
        word: 'TOTEM'
      }
    ])

    expect(best.get('E')).toBe('placed')
  })
})

describe('foundOnTryOf', () => {
  it('[mysteryword] names the try whose every letter is in place', () => {
    expect(
      foundOnTryOf([
        ['placed', 'absent', 'absent', 'absent', 'absent'],
        ['placed', 'placed', 'placed', 'placed', 'placed']
      ])
    ).toBe(2)
    expect(
      foundOnTryOf([['placed', 'present', 'absent', 'absent', 'absent']])
    ).toBe(null)
  })
})

describe('isGridDone', () => {
  it('[mysteryword] is done once found or once six tries are spent', () => {
    const miss = ['placed', 'absent', 'absent', 'absent', 'absent'] as const

    expect(isGridDone([[...miss]])).toBe(false)
    expect(isGridDone(Array.from({ length: 6 }, () => [...miss]))).toBe(true)
    expect(
      isGridDone([['placed', 'placed', 'placed', 'placed', 'placed']])
    ).toBe(true)
  })
})

describe('mostPlacedOf', () => {
  it('[mysteryword] counts the most letters in place on any one try', () => {
    expect(
      mostPlacedOf([
        ['placed', 'placed', 'absent', 'present', 'absent'],
        ['placed', 'absent', 'absent', 'absent', 'absent']
      ])
    ).toBe(2)
    expect(mostPlacedOf([])).toBe(0)
  })
})
