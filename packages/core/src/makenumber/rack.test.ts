import { describe, expect, it } from 'vitest'

import { calculationValue } from './calculation-check'
import {
  calculationAt,
  mergedRack,
  nearestMadePlace,
  openedRack,
  type Rack,
  type RackMerge,
  rackLines,
  rackPlaces,
  undoneRack
} from './rack'

const TILES = [75, 25, 7, 3, 10, 10]

const built = (merges: readonly RackMerge[]): Rack => {
  const rack = merges.reduce<Rack | null>(
    (held, merge) =>
      held === null ? null : mergedRack({ ...merge, rack: held }),
    openedRack(TILES)
  )

  if (rack === null) {
    throw new Error('the rack refused a merge it allows')
  }

  return rack
}

describe('a make-the-number rack', () => {
  it('[makenumber] puts a merge’s result in the second tile’s place and leaves the first’s empty', () => {
    expect(
      rackPlaces(built([{ from: 0, onto: 1, operator: 'add' }])).slice(0, 3)
    ).toEqual([
      { kind: 'empty' },
      { isMade: true, kind: 'tile', source: 6, value: 100 },
      { isMade: false, kind: 'tile', source: 2, value: 7 }
    ])
  })

  it('[makenumber] refuses a subtraction to zero or below, a remainder, an empty place and a tile onto itself', () => {
    const rack = openedRack(TILES)

    expect(
      mergedRack({ from: 3, onto: 2, operator: 'subtract', rack })
    ).toBeNull()
    expect(
      mergedRack({ from: 4, onto: 5, operator: 'subtract', rack })
    ).toBeNull()
    expect(
      mergedRack({ from: 0, onto: 2, operator: 'divide', rack })
    ).toBeNull()
    expect(mergedRack({ from: 2, onto: 2, operator: 'add', rack })).toBeNull()
    expect(
      mergedRack({
        from: 0,
        onto: 2,
        operator: 'add',
        rack: built([{ from: 0, onto: 1, operator: 'add' }])
      })
    ).toBeNull()
  })

  it('[makenumber] writes out the calculation behind a made tile alone, renumbered for the wire', () => {
    const rack = built([
      { from: 0, onto: 1, operator: 'add' },
      { from: 4, onto: 5, operator: 'multiply' },
      { from: 1, onto: 2, operator: 'multiply' },
      { from: 2, onto: 3, operator: 'add' }
    ])
    const steps = calculationAt({ place: 3, rack })

    expect(steps).toEqual([
      { left: 0, operator: 'add', right: 1 },
      { left: 6, operator: 'multiply', right: 2 },
      { left: 7, operator: 'add', right: 3 }
    ])
    expect(
      steps === null ? null : calculationValue({ steps, tiles: TILES })
    ).toBe(703)
    expect(calculationAt({ place: 5, rack })).toEqual([
      { left: 4, operator: 'multiply', right: 5 }
    ])
    expect(calculationAt({ place: 4, rack })).toBeNull()
    expect(calculationAt({ place: 0, rack: openedRack(TILES) })).toBeNull()
  })

  it('[makenumber] reads back every merge in order, and takes the last back on undo', () => {
    const rack = built([
      { from: 0, onto: 1, operator: 'add' },
      { from: 1, onto: 2, operator: 'multiply' }
    ])

    expect(rackLines(rack)).toEqual([
      { left: 75, operator: 'add', result: 100, right: 25 },
      { left: 100, operator: 'multiply', result: 700, right: 7 }
    ])
    expect(rackPlaces(undoneRack(rack)).slice(1, 3)).toEqual([
      { isMade: true, kind: 'tile', source: 6, value: 100 },
      { isMade: false, kind: 'tile', source: 2, value: 7 }
    ])
  })

  it('[makenumber] finds the made tile nearest the target, and none on a rack with nothing made', () => {
    const rack = built([
      { from: 4, onto: 5, operator: 'multiply' },
      { from: 0, onto: 1, operator: 'add' },
      { from: 1, onto: 2, operator: 'multiply' }
    ])

    expect(
      nearestMadePlace({ rack: openedRack(TILES), target: 703 })
    ).toBeNull()
    expect(nearestMadePlace({ rack, target: 703 })).toBe(2)
  })
})
