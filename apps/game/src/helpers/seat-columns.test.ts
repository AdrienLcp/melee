import { describe, expect, it } from 'vitest'

import { seatColumns, seatNameLines } from './seat-columns'

describe('seatColumns', () => {
  it('[layout] keeps one column while every seat fits under it', () => {
    expect(seatColumns({ count: 8, gap: 4, height: 400, rowHeight: 44 })).toBe(
      1
    )
  })

  it('[layout] adds a column once the rows would run past the box', () => {
    expect(seatColumns({ count: 24, gap: 4, height: 363, rowHeight: 44 })).toBe(
      4
    )
    expect(seatColumns({ count: 24, gap: 4, height: 380, rowHeight: 44 })).toBe(
      3
    )
  })

  it('[layout] deals a box shorter than one row into a single row', () => {
    expect(seatColumns({ count: 6, gap: 4, height: 20, rowHeight: 44 })).toBe(6)
  })
})

describe('seatNameLines', () => {
  it('[layout] gives a name every line its row holds, up to the most', () => {
    expect(seatNameLines({ lineHeight: 16.5, most: 3, rowHeight: 50 })).toBe(3)
    expect(seatNameLines({ lineHeight: 16.5, most: 3, rowHeight: 40 })).toBe(2)
    expect(seatNameLines({ lineHeight: 16.5, most: 3, rowHeight: 90 })).toBe(3)
  })

  it('[layout] keeps one line in a row shorter than it', () => {
    expect(seatNameLines({ lineHeight: 16.5, most: 3, rowHeight: 10 })).toBe(1)
  })
})
