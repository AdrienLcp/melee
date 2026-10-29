/** The smallest side, in CSS pixels, a case may be drawn at before the track changes shape. */
export const MIN_CASE_SIDE_PX = 56
/** How tall a single line of cases may grow, however wide each case is. */
export const MAX_LINE_HEIGHT_PX = 88

/**
 * How much of the band the screen draws a case at a line may give up before
 * the track folds: a line of forty fits a wide screen with cases a few vmin
 * across whatever its size, and a folded track draws them at the full band.
 */
export const LINE_SHARE_OF_BAND = 0.8

const MIN_ROWS = 2
const MIN_COLUMNS = 3

/**
 * How a track lies around a stage:
 * - `line` — one row along the top;
 * - `u` — up the left side from the start, across the top, down the right side
 *   to the finish, the bottom left open;
 * - `loop` — the U closed along the bottom, right to left, one empty cell at
 *   least between the finish and the start.
 */
export type TrackShapeKind = 'line' | 'loop' | 'u'

export type TrackShape = {
  /** The height of one case, in the pixels the shape was measured in. */
  cellHeight: number
  /** The width of one case, in the pixels the shape was measured in. */
  cellWidth: number
  columns: number
  kind: TrackShapeKind
  rows: number
}

type Grid = { columns: number; rows: number; side: number }

const rowsFromTwoTo = (top: number): number[] =>
  Array.from({ length: Math.max(0, top - 1) }, (_, offset) => offset + MIN_ROWS)

const largestCase = ({
  grids,
  height,
  width
}: {
  grids: readonly { columns: number; rows: number }[]
  height: number
  width: number
}): Grid | null =>
  grids
    .map(({ columns, rows }) => ({
      columns,
      rows,
      side: Math.min(width / columns, height / rows)
    }))
    .reduce<Grid | null>(
      (best, next) => (best === null || next.side > best.side ? next : best),
      null
    )

const spreadOver = ({
  grid: { columns, rows },
  height,
  kind,
  width
}: {
  grid: Grid
  height: number
  kind: TrackShapeKind
  width: number
}): TrackShape => ({
  cellHeight: height / rows,
  cellWidth: width / columns,
  columns,
  kind,
  rows
})

/**
 * The shape a track of `caseCount` cases takes in a box: one line while every
 * case keeps `MIN_CASE_SIDE_PX` of width and `LINE_SHARE_OF_BAND` of
 * `bandSide`, the side the screen draws a case at, else the U whose smaller side is the
 * largest if that side still keeps it, else the closed loop that draws the
 * largest cases.
 */
export const trackShapeFor = ({
  bandSide,
  caseCount,
  height,
  width
}: {
  bandSide: number
  caseCount: number
  height: number
  width: number
}): TrackShape => {
  const lineCellWidth = width / caseCount
  const line: TrackShape = {
    cellHeight: Math.min(lineCellWidth, MAX_LINE_HEIGHT_PX),
    cellWidth: lineCellWidth,
    columns: caseCount,
    kind: 'line',
    rows: 1
  }

  if (
    lineCellWidth >= Math.max(MIN_CASE_SIDE_PX, bandSide * LINE_SHARE_OF_BAND)
  ) {
    return line
  }

  const u = largestCase({
    grids: rowsFromTwoTo(Math.floor((caseCount - 1) / 2))
      .map((rows) => ({ columns: caseCount + 2 - 2 * rows, rows }))
      .filter(({ columns }) => columns >= MIN_COLUMNS),
    height,
    width
  })

  if (u !== null && u.side >= MIN_CASE_SIDE_PX) {
    return spreadOver({ grid: u, height, kind: 'u', width })
  }

  // A perimeter of 2 × columns + 2 × rows − 4 cells holds every case and the
  // empty one between the finish and the start.
  const loop = largestCase({
    grids: rowsFromTwoTo(Math.ceil(caseCount / 2)).map((rows) => ({
      columns: Math.max(MIN_COLUMNS, Math.ceil((caseCount + 5 - 2 * rows) / 2)),
      rows
    })),
    height,
    width
  })

  return loop === null
    ? line
    : spreadOver({ grid: loop, height, kind: 'loop', width })
}

/**
 * The grid cell, one-based `[column, row]`, of a case: along the line, or up
 * the first column from the bottom, along the top row, down the last column,
 * then back along the bottom row for a loop.
 */
export const trackCellOf = ({
  caseIndex,
  shape: { columns, kind, rows }
}: {
  caseIndex: number
  shape: TrackShape
}): [number, number] => {
  if (kind === 'line') {
    return [caseIndex + 1, 1]
  }

  const topEnd = rows + columns - 2
  const rightEnd = topEnd + rows

  if (caseIndex < rows) {
    return [1, rows - caseIndex]
  }

  if (caseIndex < topEnd) {
    return [caseIndex - rows + 2, 1]
  }

  if (caseIndex < rightEnd) {
    return [columns, caseIndex - topEnd + 1]
  }

  return [columns - 1 - (caseIndex - rightEnd), rows]
}
