import { describe, expect, it } from 'vitest'

import {
  type Arrivals,
  arrivalsOf,
  bandOf,
  nearestFirst,
  nearestLayoutOf
} from './make-number-nearest'

const TARGET = 627

const seatsOf = (values: readonly (number | null)[]) =>
  values.map((value, seat) => ({ id: `p${seat}`, seat, value }))

const NO_ARRIVALS: Arrivals = new Map()

describe('nearestFirst', () => {
  it('[nearest] ranks every seat by its distance, the waiting ones last in seat order', () => {
    const rows = nearestFirst({
      arrivals: NO_ARRIVALS,
      seats: seatsOf([null, 640, TARGET, 919, null, 624]),
      target: TARGET
    })

    expect(rows.map(({ id }) => id)).toEqual([
      'p2',
      'p5',
      'p1',
      'p3',
      'p0',
      'p4'
    ])
    expect(rows.map(({ band }) => band)).toEqual([
      'exact',
      'close',
      'far',
      'far',
      'owed',
      'owed'
    ])
    expect(rows.map(({ distance }) => distance)).toEqual([
      0,
      3,
      13,
      292,
      null,
      null
    ])
    expect(rows.map(({ rank }) => rank)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('[nearest] settles a tie by who reached the value first, then by seat', () => {
    const seats = seatsOf([TARGET, 630, TARGET, 624])
    const arrivals: Arrivals = new Map([
      ['p0', { at: 4, value: TARGET }],
      ['p1', { at: 2, value: 630 }],
      ['p2', { at: 3, value: TARGET }]
    ])

    expect(
      nearestFirst({ arrivals, seats, target: TARGET }).map(({ id }) => id)
    ).toEqual(['p2', 'p0', 'p1', 'p3'])
  })
})

describe('arrivalsOf', () => {
  it('[nearest] stamps a new or changed value with the next arrival and keeps the rest', () => {
    const first = arrivalsOf({
      arrivals: NO_ARRIVALS,
      seats: seatsOf([600, null, 700])
    })
    const second = arrivalsOf({
      arrivals: first,
      seats: seatsOf([600, 627, 650])
    })

    expect([...first]).toEqual([
      ['p0', { at: 1, value: 600 }],
      ['p2', { at: 2, value: 700 }]
    ])
    expect(second.get('p0')).toEqual({ at: 1, value: 600 })
    expect(second.get('p1')).toEqual({ at: 3, value: 627 })
    expect(second.get('p2')).toEqual({ at: 4, value: 650 })
  })

  it('[nearest] hands back the same arrivals when no value moved', () => {
    const arrivals = arrivalsOf({
      arrivals: NO_ARRIVALS,
      seats: seatsOf([600, null])
    })

    expect(arrivalsOf({ arrivals, seats: seatsOf([600, null]) })).toBe(arrivals)
    expect(arrivalsOf({ arrivals, seats: seatsOf([null, null]) })).not.toBe(
      arrivals
    )
  })
})

describe('bandOf', () => {
  it('[nearest] pays nothing from ten away, so the far band starts there', () => {
    expect([null, 0, 1, 9, 10, 300].map(bandOf)).toEqual([
      'owed',
      'exact',
      'close',
      'close',
      'far',
      'far'
    ])
  })
})

describe('nearestLayoutOf', () => {
  const wall = {
    columnGap: 28,
    fontCapPx: 40,
    fontFloorPx: 12,
    height: 776,
    rowCapPx: 170,
    rowGap: 12,
    width: 1808
  }

  it('[nearest] takes the columns that give a lying-down wall the largest type', () => {
    expect(nearestLayoutOf({ ...wall, count: 4 }).columns).toBe(1)
    expect(nearestLayoutOf({ ...wall, count: 8 }).columns).toBe(2)
    expect(nearestLayoutOf({ ...wall, count: 24 })).toEqual({
      columns: 3,
      fontPx: ((776 - 7 * 12) / 8) * 0.3,
      nameLines: 2,
      rows: 8
    })
  })

  it('[nearest] stands an upright wall in fewer, taller columns', () => {
    expect(
      nearestLayoutOf({ ...wall, count: 24, height: 1400, width: 1000 }).columns
    ).toBe(2)
  })

  it('[nearest] keeps the floor and a single line of name when a row is short', () => {
    const tight = nearestLayoutOf({
      ...wall,
      count: 24,
      height: 220,
      width: 760
    })

    expect(tight.fontPx).toBe(12)
    expect(tight.nameLines).toBe(1)
  })
})
