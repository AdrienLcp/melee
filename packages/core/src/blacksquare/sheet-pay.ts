import type {
  BlackSquareAnswerCount,
  BlackSquareCell,
  BlackSquareTier
} from '@melee/protocol/black-square'
import type { CellsVerdict } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'
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

const weightOf = ({
  cell,
  cellCount,
  doubledCells
}: {
  cell: BlackSquareCell
  cellCount: BlackSquareAnswerCount
  doubledCells: readonly BlackSquareCell[]
}): number =>
  tierOfCell({ cell, cellCount }) *
  (doubledCells.includes(cell) ? LONE_FIND_MULTIPLIER : 1)

const allCellsOf = (cellCount: BlackSquareAnswerCount): BlackSquareCell[] =>
  Array.from({ length: cellCount }, (_, cell) => cell)

/**
 * What a sheet is worth: a full one is the whole round, and each answer takes
 * its tier's share of it, so the least read third weighs three times the most
 * read. Nothing once it fell on the black word: cutting alone would leave
 * nothing at stake past the first few answers, and a negative score would
 * punish a late round more than an early one.
 *
 * A lone find weighs double in the share and the sheet still tops out at the
 * round: it is the sheet doubled, not the round, so a seat that found three
 * answers nobody else did is paid more for them than one that shared them,
 * and a full sheet is a full sheet either way.
 */
export const pointsForCells = ({
  cellCount,
  doubledCells = [],
  foundCells,
  hitBlackWord
}: Pick<CellsVerdict, 'cellCount' | 'foundCells' | 'hitBlackWord'> & {
  /** The cells this sheet found alone, in a room playing *Nobody else had it*. */
  doubledCells?: readonly BlackSquareCell[]
}): number => {
  if (hitBlackWord) {
    return 0
  }

  const ownLoneFinds = doubledCells.filter((cell) => foundCells.includes(cell))
  const weighed = (cells: readonly BlackSquareCell[]): number =>
    cells.reduce(
      (total, cell) =>
        total + weightOf({ cell, cellCount, doubledCells: ownLoneFinds }),
      0
    )
  return paidShare(weighed(foundCells) / weighed(allCellsOf(cellCount)))
}

/** What one answer of this tier adds to a sheet that shares it, which is what its pips say. */
export const pointsForTier = ({
  cellCount,
  tier
}: {
  cellCount: BlackSquareAnswerCount
  tier: BlackSquareTier
}): number =>
  paidShare(
    tier /
      allCellsOf(cellCount).reduce(
        (total, cell) => total + tierOfCell({ cell, cellCount }),
        0
      )
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
