import type React from 'react'

import type {
  GuessNineAnswerCount,
  GuessNineCell
} from '@melee/protocol/guess-nine'

import { tierOfCell } from '@melee/core/guessnine/sheet-pay'

/** A row is three cells wide, each two of the six tracks the grid is cut into, so a short row centres on half a cell. */
const TRACKS_PER_CELL = 2
const CELLS_PER_ROW = 3

/**
 * Where a cell sits on a guess-nine grid of any size, published for the
 * stylesheet: each tier keeps a row of its own, so a cell's place still says
 * what it pays, and a tier dealt fewer than three cells centres them.
 */
export const guessNineCellPlace = ({
  cell,
  cellCount
}: {
  cell: GuessNineCell
  cellCount: GuessNineAnswerCount
}): { column: number; row: number } => {
  const tiers = Array.from({ length: cellCount }, (_, each) =>
    tierOfCell({ cell: each, cellCount })
  )
  const row = tierOfCell({ cell, cellCount })
  const cellsInRow = tiers.filter((tier) => tier === row).length
  const indexInRow = cell - tiers.indexOf(row)

  return {
    column: 1 + (CELLS_PER_ROW - cellsInRow + TRACKS_PER_CELL * indexInRow),
    row
  }
}

export const guessNineCellStyle = (
  place: Parameters<typeof guessNineCellPlace>[0]
): React.CSSProperties => {
  const { column, row } = guessNineCellPlace(place)

  return { '--cell-column': column, '--cell-row': row }
}
