import type {
  BlackSquareCell,
  BlackSquareCellTiers,
  BlackSquareTier
} from '@melee/protocol/black-square'
import type { CellsVerdict } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'
import type { LineGrade } from './line-match'

export const emptySheet = (cellTiers: BlackSquareCellTiers): CellsVerdict => ({
  cellTiers,
  foundCells: [],
  hitBlackWord: false,
  kind: 'cells'
})

/** What a cell found by one seat alone is multiplied by, when the room plays *Nobody else had it*. */
export const LONE_FIND_MULTIPLIER = 2

const weightOf = ({
  cell,
  cellTiers,
  doubledCells
}: {
  cell: BlackSquareCell
  cellTiers: BlackSquareCellTiers
  doubledCells: readonly BlackSquareCell[]
}): number =>
  (cellTiers[cell] ?? 0) *
  (doubledCells.includes(cell) ? LONE_FIND_MULTIPLIER : 1)

const allCellsOf = (cellTiers: BlackSquareCellTiers): BlackSquareCell[] =>
  cellTiers.map((_, cell) => cell)

const totalWeightOf = (cellTiers: BlackSquareCellTiers): number =>
  cellTiers.reduce((total, tier) => total + tier, 0)

/**
 * What a sheet is worth: a full one is the whole round, and each answer takes
 * its tier's share of it, so a rare answer weighs three times an obvious
 * one. Nothing once it fell on the black word: cutting alone would leave
 * nothing at stake past the first few answers, and a negative score would
 * punish a late round more than an early one.
 *
 * A lone find weighs double in the share and the sheet still tops out at the
 * round: it is the sheet doubled, not the round, so a seat that found three
 * answers nobody else did is paid more for them than one that shared them,
 * and a full sheet is a full sheet either way.
 */
export const pointsForCells = ({
  cellTiers,
  doubledCells = [],
  foundCells,
  hitBlackWord
}: Pick<CellsVerdict, 'cellTiers' | 'foundCells' | 'hitBlackWord'> & {
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
        total + weightOf({ cell, cellTiers, doubledCells: ownLoneFinds }),
      0
    )
  return paidShare(weighed(foundCells) / weighed(allCellsOf(cellTiers)))
}

/** What one answer of this tier adds to a sheet that shares it, which is what its pips say. */
export const pointsForTier = ({
  cellTiers,
  tier
}: {
  /** Every cell the round dealt, which the round is shared across. */
  cellTiers: BlackSquareCellTiers
  tier: BlackSquareTier
}): number => paidShare(tier / totalWeightOf(cellTiers))

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
  cellTiers,
  foundCells,
  hitBlackWord
}: Pick<CellsVerdict, 'cellTiers' | 'foundCells' | 'hitBlackWord'>): boolean =>
  hitBlackWord || foundCells.length === cellTiers.length

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
