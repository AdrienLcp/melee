import {
  type Calculation,
  type CalculationOperator,
  MAKE_NUMBER_TILE_COUNT
} from '@melee/protocol/make-number'

/**
 * Two values merged into their result, or `null` when the rule refuses it: a
 * subtraction reaching zero or below, a division leaving a remainder.
 */
export const combined = ({
  left,
  operator,
  right
}: {
  left: number
  operator: CalculationOperator
  right: number
}): number | null => {
  switch (operator) {
    case 'add':
      return left + right
    case 'subtract':
      return left > right ? left - right : null
    case 'multiply':
      return left * right
    case 'divide':
      return left % right === 0 ? left / right : null
  }
}

/**
 * What a calculation over these tiles reaches — its last step's result — or
 * `null` when the tiles cannot make it: an operand not dealt or not reached
 * yet, a value used twice, a step the rule refuses.
 */
export const calculationValue = ({
  steps,
  tiles
}: {
  steps: Calculation
  tiles: readonly number[]
}): number | null => {
  if (tiles.length !== MAKE_NUMBER_TILE_COUNT) {
    return null
  }

  const values = [...tiles]
  const used = new Set<number>()

  for (const { left, operator, right } of steps) {
    const leftValue = values[left]
    const rightValue = values[right]

    if (
      left === right ||
      leftValue === undefined ||
      rightValue === undefined ||
      used.has(left) ||
      used.has(right)
    ) {
      return null
    }

    const result = combined({ left: leftValue, operator, right: rightValue })

    if (result === null) {
      return null
    }

    used.add(left)
    used.add(right)
    values.push(result)
  }

  return values.length > tiles.length ? (values.at(-1) ?? null) : null
}
