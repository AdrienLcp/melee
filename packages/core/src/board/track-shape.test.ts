import { describe, expect, it } from 'vitest'

import {
  LINE_SHARE_OF_BAND,
  MAX_LINE_HEIGHT_PX,
  MIN_CASE_SIDE_PX,
  type TrackShape,
  trackCellOf,
  trackShapeFor
} from './track-shape'

/** A 1440 × 900 console's stage once its panel stands beside it, and its 9vmin band. */
const DESK_STAGE = { bandSide: 81, height: 900, width: 1056 }
/** A wall on a 2560 × 1440 screen, whose band is 9vmin. */
const WIDE_WALL = { bandSide: 130, height: 1440, width: 2560 }

const cellsOf = ({
  caseCount,
  shape
}: {
  caseCount: number
  shape: TrackShape
}) =>
  Array.from({ length: caseCount }, (_, caseIndex) =>
    trackCellOf({ caseIndex, shape }).join(':')
  )

describe('trackShapeFor', () => {
  it('[board] lays ten cases along one line, no taller than its cap', () => {
    const shape = trackShapeFor({ caseCount: 11, ...DESK_STAGE })

    expect(shape).toMatchObject({ columns: 11, kind: 'line', rows: 1 })
    expect(shape.cellHeight).toBe(MAX_LINE_HEIGHT_PX)
  })

  it('[board] folds thirty cases into a U whose cases stay readable', () => {
    const shape = trackShapeFor({ caseCount: 31, ...DESK_STAGE })

    expect(shape.kind).toBe('u')
    expect(2 * shape.rows + shape.columns - 2).toBe(31)
    expect(Math.min(shape.cellWidth, shape.cellHeight)).toBeGreaterThanOrEqual(
      MIN_CASE_SIDE_PX
    )
  })

  it('[board] folds forty cases a wide wall could line up, so they grow with the screen', () => {
    const shape = trackShapeFor({ caseCount: 40, ...WIDE_WALL })

    expect(shape.kind).toBe('u')
    expect(Math.min(shape.cellWidth, shape.cellHeight)).toBeGreaterThanOrEqual(
      WIDE_WALL.bandSide * LINE_SHARE_OF_BAND
    )
  })

  it('[board] keeps fourteen cases on a desk in one line a little under its band', () => {
    const shape = trackShapeFor({ caseCount: 15, ...DESK_STAGE })

    expect(shape.kind).toBe('line')
  })

  it('[board] closes sixty cases into a loop with room for every one and a gap', () => {
    const shape = trackShapeFor({ caseCount: 61, ...DESK_STAGE })

    expect(shape.kind).toBe('loop')
    expect(2 * shape.columns + 2 * shape.rows - 4).toBeGreaterThanOrEqual(62)
  })
})

describe('trackCellOf', () => {
  it('[board] walks a U up, across and down, leaving the bottom row open', () => {
    const shape = trackShapeFor({ caseCount: 31, ...DESK_STAGE })
    const cells = cellsOf({ caseCount: 31, shape })

    expect(cells[0]).toBe(`1:${shape.rows}`)
    expect(cells[shape.rows - 1]).toBe('1:1')
    expect(cells.at(-1)).toBe(`${shape.columns}:${shape.rows}`)
    expect(new Set(cells).size).toBe(31)
  })

  it('[board] brings a loop back along the bottom, short of the start', () => {
    const shape = trackShapeFor({ caseCount: 61, ...DESK_STAGE })
    const cells = cellsOf({ caseCount: 61, shape })
    const [finishColumn, finishRow] = trackCellOf({ caseIndex: 60, shape })

    expect(new Set(cells).size).toBe(61)
    expect(finishRow).toBe(shape.rows)
    expect(finishColumn).toBeGreaterThanOrEqual(3)
  })
})
