import type {
  BlackSquareAnswerCount,
  BlackSquareCell,
  BlackSquareTier
} from '@melee/protocol/black-square'
import { type CellsVerdict, POINT } from '@melee/protocol/scoring'

import type { LineGrade } from './line-match'

const TIER_COUNT = 3

/**
 * What a cell pays, by the third of the dealt answers its rank falls in: the
 * most read third 1, the least read 3, so nine dealt make a full sheet 18. A
 * count that does not split evenly gives the spare cells to the cheap end,
 * where the most read answers sit.
 */
export const tierOfCell = ({
  cell,
  cellCount
}: {
  cell: BlackSquareCell
  cellCount: BlackSquareAnswerCount
}): BlackSquareTier => Math.floor((cell * TIER_COUNT) / cellCount) + 1

export const emptySheet = (
  cellCount: BlackSquareAnswerCount
): CellsVerdict => ({
  cellCount,
  foundCells: [],
  hitBlackWord: false,
  kind: 'cells'
})

/** What a cell found by one seat alone is multiplied by, when the room plays *Nobody else had it*. */
export const LONE_FIND_MULTIPLIER = 2

/**
 * What a sheet is worth, which is nothing once it fell on the black word:
 * cutting alone would leave nothing at stake past the first few answers, and a
 * negative score would punish a late round more than an early one.
 */
export const pointsForCells = ({
  cellCount,
  doubledCells = [],
  foundCells,
  hitBlackWord
}: Pick<CellsVerdict, 'cellCount' | 'foundCells' | 'hitBlackWord'> & {
  /** The cells this sheet found alone, in a room playing *Nobody else had it*. */
  doubledCells?: readonly BlackSquareCell[]
}): number =>
  hitBlackWord
    ? 0
    : foundCells.reduce(
        (total, cell) =>
          total +
          tierOfCell({ cell, cellCount }) *
            POINT *
            (doubledCells.includes(cell) ? LONE_FIND_MULTIPLIER : 1),
        0
      )

/**
 * The cells exactly one sheet found — *Pointless* without a survey, the table
 * being the survey. A sheet voided on the black word still found its cells:
 * whoever fell had it too, so it is nobody's lone find.
 */
export const loneCellsOf = (
  sheets: readonly Pick<CellsVerdict, 'foundCells'>[]
): BlackSquareCell[] =>
  [...new Set(sheets.flatMap((sheet) => sheet.foundCells))]
    .filter(
      (cell) =>
        sheets.filter((sheet) => sheet.foundCells.includes(cell)).length === 1
    )
    .toSorted((left, right) => left - right)

/** Whether a seat can send no more lines: it fell on the black word, or holds every answer dealt. */
export const isSheetClosed = ({
  cellCount,
  foundCells,
  hitBlackWord
}: Pick<CellsVerdict, 'cellCount' | 'foundCells' | 'hitBlackWord'>): boolean =>
  hitBlackWord || foundCells.length === cellCount

/** The sheet after one more line, which only ever grows — a line matching a cell already found adds nothing. */
export const withLineBanked = ({
  graded,
  sheet
}: {
  graded: LineGrade
  sheet: CellsVerdict
}): CellsVerdict => {
  switch (graded.kind) {
    case 'blackWord':
      return { ...sheet, hitBlackWord: true }
    case 'cells':
      return {
        ...sheet,
        foundCells: [
          ...sheet.foundCells,
          ...graded.cells.filter((cell) => !sheet.foundCells.includes(cell))
        ]
      }
    case 'nothing':
      return sheet
  }
}

/**
 * The sheet after the keeper of a spoken round ticks or unticks one of the
 * answers, which only the keeper's hand decides: a mistaken tick is taken back
 * until the reveal, and the black word, once ticked, is not.
 */
export const withCellTicked = ({
  cell,
  isTicked,
  sheet
}: {
  cell: BlackSquareCell | 'blackWord'
  isTicked: boolean
  sheet: CellsVerdict
}): CellsVerdict => {
  if (cell === 'blackWord') {
    return isTicked ? { ...sheet, hitBlackWord: true } : sheet
  }

  const others = sheet.foundCells.filter((found) => found !== cell)

  return { ...sheet, foundCells: isTicked ? [...others, cell] : others }
}
