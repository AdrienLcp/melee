import type {
  Calculation,
  CalculationOperator,
  CalculationStep
} from '@melee/protocol/make-number'

import { type CalculationLine, combined } from './calculation-check'

/**
 * A seat's six places as it builds: the tiles as dealt, and every merge in
 * the order it was made. Everything else — what each place holds, the
 * calculation behind a made tile — is read back from those, so undoing is
 * dropping the last merge.
 */
export type Rack = {
  merges: readonly RackMerge[]
  tiles: readonly number[]
}

/** The tile lifted first merged onto the second, which takes the result; the first's place is left empty. */
export type RackMerge = {
  from: number
  onto: number
  operator: CalculationOperator
}

/**
 * One place on the rack: a tile — dealt, or made by a merge — or the empty
 * socket a tile left by merging onto another. `source` is the tile's index
 * among the rack's values: 0–5 the dealt tiles, 6 onward each merge's result.
 */
export type RackPlace =
  | { kind: 'empty' }
  | { isMade: boolean; kind: 'tile'; source: number; value: number }

type Replay = {
  lines: readonly CalculationLine[]
  /** For each merge, the sources it took, left then right. */
  operands: readonly (readonly [number, number])[]
  places: readonly RackPlace[]
}

const replayed = (rack: Rack): Replay => {
  const places: RackPlace[] = rack.tiles.map((value, source) => ({
    isMade: false,
    kind: 'tile',
    source,
    value
  }))
  const operands: (readonly [number, number])[] = []
  const lines: CalculationLine[] = []

  for (const { from, onto, operator } of rack.merges) {
    const left = places[from]
    const right = places[onto]

    if (left?.kind !== 'tile' || right?.kind !== 'tile' || from === onto) {
      break
    }

    const result = combined({ left: left.value, operator, right: right.value })

    if (result === null) {
      break
    }

    places[from] = { kind: 'empty' }
    places[onto] = {
      isMade: true,
      kind: 'tile',
      source: rack.tiles.length + operands.length,
      value: result
    }
    operands.push([left.source, right.source])
    lines.push({ left: left.value, operator, result, right: right.value })
  }

  return { lines, operands, places }
}

/** A rack with nothing merged yet. */
export const openedRack = (tiles: readonly number[]): Rack => ({
  merges: [],
  tiles
})

/** What each of the rack's places holds now. */
export const rackPlaces = (rack: Rack): readonly RackPlace[] =>
  replayed(rack).places

/** Every merge made so far, in order, as the seat would say it. */
export const rackLines = (rack: Rack): readonly CalculationLine[] =>
  replayed(rack).lines

/**
 * The rack with `from` merged onto `onto`, or `null` when the rule refuses
 * it — an empty place, a tile onto itself, a subtraction reaching zero, a
 * division leaving a remainder. A screen dims what this refuses.
 */
export const mergedRack = ({
  from,
  onto,
  operator,
  rack
}: RackMerge & { rack: Rack }): Rack | null => {
  const { places } = replayed(rack)
  const left = places[from]
  const right = places[onto]

  if (left?.kind !== 'tile' || right?.kind !== 'tile' || from === onto) {
    return null
  }

  return combined({ left: left.value, operator, right: right.value }) === null
    ? null
    : { ...rack, merges: [...rack.merges, { from, onto, operator }] }
}

/** The rack with its last merge taken back. */
export const undoneRack = (rack: Rack): Rack => ({
  ...rack,
  merges: rack.merges.slice(0, -1)
})

/**
 * The calculation behind the made tile at this place, in the wire's shape:
 * only the merges that went into it, in the order made, each result numbered
 * after the six tiles by its rank among them. `null` for a dealt tile or an
 * empty place, which no calculation reaches.
 */
export const calculationAt = ({
  place,
  rack
}: {
  place: number
  rack: Rack
}): Calculation | null => {
  const { operands, places } = replayed(rack)
  const held = places[place]

  if (held?.kind !== 'tile' || !held.isMade) {
    return null
  }

  const dealt = rack.tiles.length
  const needed = new Set<number>()
  const need = (source: number): void => {
    const pair = operands[source - dealt]

    if (source < dealt || pair === undefined) {
      return
    }

    needed.add(source - dealt)
    need(pair[0])
    need(pair[1])
  }

  need(held.source)

  const merges = [...needed].toSorted((left, right) => left - right)
  const operandOf = (source: number): number =>
    source < dealt ? source : dealt + merges.indexOf(source - dealt)

  return merges.flatMap((merge): CalculationStep[] => {
    const pair = operands[merge]
    const operator = rack.merges[merge]?.operator

    return pair === undefined || operator === undefined
      ? []
      : [{ left: operandOf(pair[0]), operator, right: operandOf(pair[1]) }]
  })
}

/**
 * The place of the made tile nearest the target, the first of them on a tie,
 * or `null` while nothing is made — what a seat sends with no tile lifted,
 * and what its screen leans.
 */
export const nearestMadePlace = ({
  rack,
  target
}: {
  rack: Rack
  target: number
}): number | null => {
  let nearest: { distance: number; place: number } | null = null

  for (const [place, held] of rackPlaces(rack).entries()) {
    if (held.kind !== 'tile' || !held.isMade) {
      continue
    }

    const distance = Math.abs(held.value - target)

    if (nearest === null || distance < nearest.distance) {
      nearest = { distance, place }
    }
  }

  return nearest?.place ?? null
}
