import type {
  CalculationOperator,
  CalculationStep
} from '@melee/protocol/make-number'

type Reached = { subset: number; value: number }

type Way =
  | { index: number; kind: 'tile' }
  | {
      kind: 'step'
      left: Reached
      operator: CalculationOperator
      right: Reached
    }

/** Every value a subset of the tiles reaches, each with the first way found to reach it. */
type Reach = Map<number, Map<number, Way>>

const sizeOf = (subset: number): number => {
  let size = 0

  for (let rest = subset; rest > 0; rest &= rest - 1) {
    size++
  }

  return size
}

const subsetsBySize = (tileCount: number): number[] =>
  Array.from(
    { length: (1 << tileCount) - 1 },
    (_, index) => index + 1
  ).toSorted((one, other) => sizeOf(one) - sizeOf(other) || one - other)

const keep = ({
  reached,
  value,
  way
}: {
  reached: Map<number, Way>
  value: number
  way: Way
}): void => {
  if (!reached.has(value)) {
    reached.set(value, way)
  }
}

/**
 * Every value two disjoint subsets make together, the larger first wherever
 * the order matters: a subtraction stays above zero and a division exact.
 */
const mergeInto = ({
  one,
  other,
  reach,
  reached
}: {
  one: number
  other: number
  reach: Reach
  reached: Map<number, Way>
}): void => {
  for (const [a] of reach.get(one) ?? []) {
    for (const [b] of reach.get(other) ?? []) {
      const [larger, smaller] =
        a >= b
          ? [
              { subset: one, value: a },
              { subset: other, value: b }
            ]
          : [
              { subset: other, value: b },
              { subset: one, value: a }
            ]
      const step = (operator: CalculationOperator): Way => ({
        kind: 'step',
        left: larger,
        operator,
        right: smaller
      })

      keep({ reached, value: a + b, way: step('add') })
      keep({ reached, value: a * b, way: step('multiply') })

      if (larger.value > smaller.value) {
        keep({
          reached,
          value: larger.value - smaller.value,
          way: step('subtract')
        })
      }

      if (larger.value % smaller.value === 0) {
        keep({
          reached,
          value: larger.value / smaller.value,
          way: step('divide')
        })
      }
    }
  }
}

/** The steps that reach `value` from `subset`, numbered the way a calculation numbers its operands. */
const stepsTo = ({
  reach,
  subset,
  tileCount,
  value
}: Reached & { reach: Reach; tileCount: number }): CalculationStep[] => {
  const steps: CalculationStep[] = []

  const operandOf = ({ subset: from, value: made }: Reached): number => {
    const way = reach.get(from)?.get(made)

    if (way === undefined || way.kind === 'tile') {
      return way?.index ?? -1
    }

    const left = operandOf(way.left)
    const right = operandOf(way.right)

    steps.push({ left, operator: way.operator, right })

    return tileCount + steps.length - 1
  }

  operandOf({ subset, value })

  return steps
}

/**
 * One way to make `target` from the tiles using as few of them as possible,
 * or `null` when no subset reaches it. Dynamic programming over the subsets,
 * walked by size: each maps every value it reaches to one way of reaching
 * it, built from the maps of two disjoint subsets that partition it, so the
 * first subset holding the target is a fewest-tiles solution. A tile that is
 * the target itself is a solution of no step.
 */
export const shortestSolution = ({
  target,
  tiles
}: {
  target: number
  tiles: readonly number[]
}): CalculationStep[] | null => {
  const reach: Reach = new Map()

  for (const subset of subsetsBySize(tiles.length)) {
    const reached = new Map<number, Way>()
    const lowest = subset & -subset

    if (subset === lowest) {
      const index = Math.log2(subset)

      reached.set(tiles[index] ?? 0, { index, kind: 'tile' })
    }

    for (let one = (subset - 1) & subset; one > 0; one = (one - 1) & subset) {
      if ((one & lowest) !== 0) {
        mergeInto({ one, other: subset ^ one, reach, reached })
      }
    }

    reach.set(subset, reached)

    if (reached.has(target)) {
      return stepsTo({
        reach,
        subset,
        tileCount: tiles.length,
        value: target
      })
    }
  }

  return null
}
