import {
  GUESS_NINE_CELL_COUNT,
  type GuessNineCell,
  type GuessNineTier
} from '@melee/protocol/guess-nine'
import { type CellsVerdict, POINT } from '@melee/protocol/scoring'

import type { LineGrade } from './line-match'

const CELLS_PER_TIER = 3

/**
 * What a cell pays, by its rank among the nine: the three most read 1, the
 * next three 2, the last three 3, so a full sheet is 18.
 */
export const tierOfCell = (cell: GuessNineCell): GuessNineTier =>
  Math.floor(cell / CELLS_PER_TIER) + 1

export const EMPTY_SHEET: CellsVerdict = {
  foundCells: [],
  hitBlackWord: false,
  kind: 'cells'
}

/**
 * What a sheet is worth, which is nothing once it fell on the black word:
 * cutting alone would leave nothing at stake past the first few answers, and a
 * negative score would punish a late round more than an early one.
 */
export const pointsForCells = ({
  foundCells,
  hitBlackWord
}: Pick<CellsVerdict, 'foundCells' | 'hitBlackWord'>): number =>
  hitBlackWord
    ? 0
    : foundCells.reduce((total, cell) => total + tierOfCell(cell) * POINT, 0)

/** Whether a seat can send no more lines: it fell on the black word, or holds all nine. */
export const isSheetClosed = ({
  foundCells,
  hitBlackWord
}: Pick<CellsVerdict, 'foundCells' | 'hitBlackWord'>): boolean =>
  hitBlackWord || foundCells.length === GUESS_NINE_CELL_COUNT

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
