import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import {
  EMPTY_SHEET,
  isSheetClosed,
  loneCellsOf,
  pointsForCells,
  tierOfCell,
  withCellTicked,
  withLineBanked
} from './sheet-pay'

const sheetOf = (foundCells: number[], hitBlackWord = false) => ({
  foundCells,
  hitBlackWord,
  kind: 'cells' as const
})

describe('what a guess-nine sheet pays', () => {
  it('[guessnine] pays the most read three one point and the least read three', () => {
    expect([0, 2, 3, 5, 6, 8].map(tierOfCell)).toEqual([1, 1, 2, 2, 3, 3])
  })

  it('[guessnine] pays eighteen for a full sheet', () => {
    expect(pointsForCells(sheetOf([0, 1, 2, 3, 4, 5, 6, 7, 8]))).toBe(
      18 * POINT
    )
  })

  it('[guessnine] pays nothing once the black word is hit, whatever the sheet held', () => {
    expect(pointsForCells(sheetOf([6, 7, 8], true))).toBe(0)
  })

  it('[guessnine] pays double the cells a sheet found alone', () => {
    expect(pointsForCells({ ...sheetOf([0, 8]), doubledCells: [8] })).toBe(
      (1 + 2 * 3) * POINT
    )
  })

  it('[guessnine] pays a voided sheet nothing, lone finds included', () => {
    expect(pointsForCells({ ...sheetOf([8], true), doubledCells: [8] })).toBe(0)
  })

  it('[guessnine] finds a cell alone only when no other sheet holds it, voided or not', () => {
    expect(
      loneCellsOf([sheetOf([0, 4, 7]), sheetOf([0, 5]), sheetOf([7], true)])
    ).toEqual([4, 5])
  })

  it('[guessnine] closes a sheet on the black word or on all nine, never on a hit', () => {
    expect(isSheetClosed(sheetOf([0]))).toBe(false)
    expect(isSheetClosed(sheetOf([], true))).toBe(true)
    expect(isSheetClosed(sheetOf([0, 1, 2, 3, 4, 5, 6, 7, 8]))).toBe(true)
  })
})

describe('banking a guess-nine line', () => {
  it('[guessnine] adds a cell once, however often it is found', () => {
    const once = withLineBanked({
      graded: { cells: [2, 3], kind: 'cells' },
      sheet: EMPTY_SHEET
    })

    expect(
      withLineBanked({ graded: { cells: [3], kind: 'cells' }, sheet: once })
        .foundCells
    ).toEqual([2, 3])
  })

  it('[guessnine] keeps the sheet on a line that names nothing', () => {
    const sheet = sheetOf([4])

    expect(withLineBanked({ graded: { kind: 'nothing' }, sheet })).toEqual(
      sheet
    )
  })

  it('[guessnine] marks the black word without dropping the cells', () => {
    expect(
      withLineBanked({ graded: { kind: 'blackWord' }, sheet: sheetOf([1]) })
    ).toEqual(sheetOf([1], true))
  })
})

describe('ticking a spoken guess-nine list', () => {
  it('[guessnine] banks a ticked cell once, however often it is ticked', () => {
    const once = withCellTicked({ cell: 4, isTicked: true, sheet: EMPTY_SHEET })

    expect(withCellTicked({ cell: 4, isTicked: true, sheet: once })).toEqual(
      sheetOf([4])
    )
  })

  it('[guessnine] takes a mistaken tick back', () => {
    expect(
      withCellTicked({ cell: 4, isTicked: false, sheet: sheetOf([2, 4]) })
    ).toEqual(sheetOf([2]))
  })

  it('[guessnine] never takes the black word back once ticked', () => {
    const fallen = withCellTicked({
      cell: 'blackWord',
      isTicked: true,
      sheet: sheetOf([2])
    })

    expect(
      withCellTicked({ cell: 'blackWord', isTicked: false, sheet: fallen })
    ).toEqual(sheetOf([2], true))
  })
})
