import { describe, expect, it } from 'vitest'

import type { BlackSquareCellTiers } from '@melee/protocol/black-square'

import { blackSquareCellPlace } from './black-square-cell-place'

const placesOf = (cellTiers: BlackSquareCellTiers): string[] =>
  cellTiers.map((_, cell) => {
    const { column, row } = blackSquareCellPlace({ cell, cellTiers })

    return `${row}:${column}`
  })

describe('blackSquareCellPlace', () => {
  it('[layout] lays three tiers of three as three rows, one tier a row', () => {
    expect(placesOf([1, 1, 1, 2, 2, 2, 3, 3, 3])).toEqual([
      '1:1',
      '1:3',
      '1:5',
      '2:1',
      '2:3',
      '2:5',
      '3:1',
      '3:3',
      '3:5'
    ])
  })

  it('[layout] centres a tier dealt fewer than three cells', () => {
    expect(placesOf([1, 1, 2, 2, 3])).toEqual([
      '1:2',
      '1:4',
      '2:2',
      '2:4',
      '3:3'
    ])
    expect(placesOf([1, 2, 3])).toEqual(['1:3', '2:3', '3:3'])
  })

  it('[layout] keeps a tier on its own row when the round dealt none of another', () => {
    expect(placesOf([1, 1, 3, 3])).toEqual(['1:2', '1:4', '3:2', '3:4'])
  })

  it('[layout] spills a tier of more than three cells into the rows beside it', () => {
    expect(placesOf([1, 1, 2, 2, 2, 2, 2, 3, 3])).toEqual([
      '1:1',
      '1:3',
      '1:5',
      '2:1',
      '2:3',
      '2:5',
      '3:1',
      '3:3',
      '3:5'
    ])
    expect(placesOf([1, 1, 2, 2, 2, 2, 3, 3])).toEqual([
      '1:1',
      '1:3',
      '1:5',
      '2:1',
      '2:3',
      '2:5',
      '3:2',
      '3:4'
    ])
  })
})
