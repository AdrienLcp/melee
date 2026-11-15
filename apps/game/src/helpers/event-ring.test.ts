import { describe, expect, it } from 'vitest'

import { createEventRing } from './event-ring'

type Detail = { height: number }

const ringOf = (capacity: number) =>
  createEventRing<'resize' | 'focus', Detail>({ capacity, coalesceMs: 100 })

describe('event ring', () => {
  it('[event-ring] drops the oldest entry past its capacity', () => {
    const ring = ringOf(3)

    for (const at of [0, 1000, 2000, 3000]) {
      ring.note({
        at,
        detail: { height: at },
        type: at % 2000 === 0 ? 'resize' : 'focus'
      })
    }

    expect(ring.since(0).map((entry) => entry.at)).toEqual([1000, 2000, 3000])
  })

  it('[event-ring] folds a run of one type into its last values and its length', () => {
    const ring = ringOf(10)

    ring.note({ at: 0, detail: { height: 800 }, type: 'resize' })
    ring.note({ at: 16, detail: { height: 600 }, type: 'resize' })
    ring.note({ at: 32, detail: { height: 412 }, type: 'resize' })

    expect(ring.since(0)).toEqual([
      { at: 32, count: 3, detail: { height: 412 }, type: 'resize' }
    ])
  })

  it('[event-ring] keeps two of a type apart once the gap reaches the fold', () => {
    const ring = ringOf(10)

    ring.note({ at: 0, detail: { height: 800 }, type: 'resize' })
    ring.note({ at: 100, detail: { height: 412 }, type: 'resize' })

    expect(ring.since(0)).toHaveLength(2)
  })

  it('[event-ring] never folds across another type', () => {
    const ring = ringOf(10)

    ring.note({ at: 0, detail: { height: 800 }, type: 'resize' })
    ring.note({ at: 10, detail: { height: 0 }, type: 'focus' })
    ring.note({ at: 20, detail: { height: 412 }, type: 'resize' })

    expect(ring.since(0).map((entry) => entry.type)).toEqual([
      'resize',
      'focus',
      'resize'
    ])
  })

  it('[event-ring] answers only what was noted from the moment asked', () => {
    const ring = ringOf(10)

    ring.note({ at: 0, detail: { height: 1 }, type: 'resize' })
    ring.note({ at: 5000, detail: { height: 2 }, type: 'focus' })

    expect(ring.since(4000).map((entry) => entry.at)).toEqual([5000])
  })
})
