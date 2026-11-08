import type React from 'react'

import type {
  BlackSquareCell,
  BlackSquareCellTiers
} from '@melee/protocol/black-square'

/** A cell spans two tracks, so a row one cell shorter than the widest centres on half a cell. */
const TRACKS_PER_CELL = 2
const CELLS_PER_ROW = 3

/**
 * The row each cell sits on: one per tier dealt, in tier order, while every
 * tier fits a row, and otherwise three a row in cell order, the crowded tier
 * spilling into the rows beside it — a nine-cell round deals five medium
 * answers. A tier the round dealt none of takes no row, so the grid never
 * holds an empty band.
 */
const rowsOf = (cellTiers: BlackSquareCellTiers): number[] => {
  const everyTierFitsARow = cellTiers.every(
    (tier) => cellTiers.filter((each) => each === tier).length <= CELLS_PER_ROW
  )

  if (!everyTierFitsARow) {
    return cellTiers.map((_, cell) => 1 + Math.floor(cell / CELLS_PER_ROW))
  }

  const dealtTiers = [...new Set(cellTiers)].toSorted((a, b) => a - b)

  return cellTiers.map((tier) => 1 + dealtTiers.indexOf(tier))
}

const widestRowOf = (rows: number[]): number =>
  Math.max(...rows.map((row) => rows.filter((each) => each === row).length))

/**
 * The grid a black-square round is laid on: as many rows as it uses and as
 * wide as its widest row, so four cells make a diamond of square-ish cells
 * rather than a narrow column down the middle of a nine-cell frame.
 */
export const blackSquareGridShape = (
  cellTiers: BlackSquareCellTiers
): { columns: number; rows: number } => {
  const rows = rowsOf(cellTiers)

  return {
    columns: TRACKS_PER_CELL * widestRowOf(rows),
    rows: Math.max(...rows)
  }
}

/**
 * Where a cell sits on its round's grid: each tier keeps a row of its own, so
 * a cell's place still says what it pays, and a row shorter than the widest
 * centres its cells.
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
    column: 1 + (widestRowOf(rows) - cellsInRow + TRACKS_PER_CELL * indexInRow),
    row
  }
}

export const blackSquareGridStyle = (
  cellTiers: BlackSquareCellTiers
): React.CSSProperties => {
  const { columns, rows } = blackSquareGridShape(cellTiers)

  return { '--grid-columns': columns, '--grid-rows': rows }
}

export const blackSquareCellStyle = (
  place: Parameters<typeof blackSquareCellPlace>[0]
): React.CSSProperties => {
  const { column, row } = blackSquareCellPlace(place)

  return { '--cell-column': column, '--cell-row': row }
}
