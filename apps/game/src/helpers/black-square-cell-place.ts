import type React from 'react'

import type {
  BlackSquareCell,
  BlackSquareCellTiers
} from '@melee/protocol/black-square'

/** A row is three cells wide, each two of the six tracks the grid is cut into, so a short row centres on half a cell. */
const TRACKS_PER_CELL = 2
const CELLS_PER_ROW = 3

/**
 * The row each cell sits on: its own tier's while every tier fits one row,
 * and otherwise three a row in cell order, the crowded tier spilling into the
 * rows beside it — a nine-cell round deals five medium answers.
 */
const rowsOf = (cellTiers: BlackSquareCellTiers): number[] => {
  const everyTierFitsARow = cellTiers.every(
    (tier) => cellTiers.filter((each) => each === tier).length <= CELLS_PER_ROW
  )

  return everyTierFitsARow
    ? [...cellTiers]
    : cellTiers.map((_, cell) => 1 + Math.floor(cell / CELLS_PER_ROW))
}

/**
 * Where a cell sits on a black-square grid of any size, published for the
 * stylesheet: each tier keeps a row of its own, so a cell's place still says
 * what it pays, and a row holding fewer than three cells centres them.
 */
export const blackSquareCellPlace = ({
  cell,
  cellTiers
}: {
  cell: BlackSquareCell
  cellTiers: BlackSquareCellTiers
}): { column: number; row: number } => {
  const rows = rowsOf(cellTiers)
  const row = rows[cell] ?? 1
  const cellsInRow = rows.filter((each) => each === row).length
  const indexInRow = cell - rows.indexOf(row)

  return {
    column: 1 + (CELLS_PER_ROW - cellsInRow + TRACKS_PER_CELL * indexInRow),
    row
  }
}

export const blackSquareCellStyle = (
  place: Parameters<typeof blackSquareCellPlace>[0]
): React.CSSProperties => {
  const { column, row } = blackSquareCellPlace(place)

  return { '--cell-column': column, '--cell-row': row }
}
