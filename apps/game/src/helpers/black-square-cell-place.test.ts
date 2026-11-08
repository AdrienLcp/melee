import { describe, expect, it } from 'vitest'

import type { BlackSquareCellTiers } from '@melee/protocol/black-square'

import {
  blackSquareCellPlace,
  blackSquareGridShape
} from './black-square-cell-place'

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

  it('[layout] lays four cells as a diamond two cells wide', () => {
    expect(placesOf([1, 2, 2, 3])).toEqual(['1:2', '2:1', '2:3', '3:2'])
    expect(blackSquareGridShape([1, 2, 2, 3])).toEqual({ columns: 4, rows: 3 })
  })

  it('[layout] centres a tier dealt fewer cells than the widest row', () => {
    expect(placesOf([1, 1, 2, 2, 3])).toEqual([
      '1:1',
      '1:3',
      '2:1',
      '2:3',
      '3:2'
    ])
    expect(placesOf([1, 2, 3])).toEqual(['1:1', '2:1', '3:1'])
  })

  it('[layout] gives no row to a tier the round dealt none of', () => {
    expect(placesOf([1, 1, 3, 3])).toEqual(['1:1', '1:3', '2:1', '2:3'])
    expect(blackSquareGridShape([1, 1, 3, 3])).toEqual({ columns: 4, rows: 2 })
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
