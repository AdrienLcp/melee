import { describe, expect, it } from 'vitest'

import { blackSquareCellPlace } from './black-square-cell-place'

const placesOf = (cellCount: number): string[] =>
  Array.from({ length: cellCount }, (_, cell) => {
    const { column, row } = blackSquareCellPlace({ cell, cellCount })

    return `${row}:${column}`
  })

describe('blackSquareCellPlace', () => {
  it('[layout] lays nine as three rows of three, one tier a row', () => {
    expect(placesOf(9)).toEqual([
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
    expect(placesOf(5)).toEqual(['1:2', '1:4', '2:2', '2:4', '3:3'])
    expect(placesOf(3)).toEqual(['1:3', '2:3', '3:3'])
  })
})
