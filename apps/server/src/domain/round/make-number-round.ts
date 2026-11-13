import type { PlayerId } from '@melee/protocol/identifiers'
import type { Calculation } from '@melee/protocol/make-number'
import type { RoundContent } from '@melee/protocol/room'
import type { CalculationVerdict } from '@melee/protocol/scoring'

import {
  calculationValue,
  combined,
  OPERATOR_SIGNS
} from '@melee/core/makenumber/calculation-check'
import type { PlayableNumbers } from '@melee/core/makenumber/playable-draw'

import type { Round, SentCalculation } from '@/domain/room/room'

type MakeNumberContent = Extract<Round['content'], { kind: 'makenumber' }>

/** A round on these six tiles and this target, solved before it opens. */
export const makeNumberContent = ({
  solution,
  target,
  tiles
}: PlayableNumbers): MakeNumberContent => ({
  calculations: new Map(),
  kind: 'makenumber',
  solution,
  target,
  tiles
})

/** What a sent calculation reaches over the round's tiles, or `null` when they cannot make it. */
export const valueOfCalculation = ({
  content,
  steps
}: {
  content: MakeNumberContent
  steps: Calculation
}): number | null => calculationValue({ steps, tiles: content.tiles })

/**
 * The seat's verdict with this value reached: the value's distance when it is
 * nearer than what the seat held, and what it held otherwise — a later value
 * as far off does not replace the first.
 */
export const gradeCalculation = ({
  content,
  held,
  value
}: {
  content: MakeNumberContent
  held: CalculationVerdict | null
  value: number
}): CalculationVerdict => {
  const distance = Math.abs(value - content.target)

  return held !== null && held.distance <= distance
    ? held
    : { distance, kind: 'calculation', value }
}

/** A calculation written out step by step — `75 + 25 = 100, 100 × 7 = 700` — for the console's list of what each seat said. */
export const writtenCalculation = ({
  steps,
  tiles
}: {
  steps: Calculation
  tiles: readonly number[]
}): string => {
  const values = [...tiles]

  return steps
    .map(({ left, operator, right }) => {
      const leftValue = values[left] ?? 0
      const rightValue = values[right] ?? 0
      const result =
        combined({ left: leftValue, operator, right: rightValue }) ?? 0

      values.push(result)

      return `${leftValue} ${OPERATOR_SIGNS[operator]} ${rightValue} = ${result}`
    })
    .join(', ')
}

/** A seat's paid calculation among the ones it sent: the first of the smallest distance. */
export const nearestOf = ({
  sent,
  target
}: {
  sent: readonly SentCalculation[]
  target: number
}): SentCalculation | null =>
  sent.reduce<SentCalculation | null>(
    (nearest, calculation) =>
      nearest === null ||
      Math.abs(calculation.value - target) < Math.abs(nearest.value - target)
        ? calculation
        : nearest,
    null
  )

/**
 * The round as a seat, the wall or a seated console reads it. Every screen
 * reads the tiles, the target and each seat's nearest value; the reader reads
 * its own calculations, and the reveal spells out every seat's beside the
 * draw's shortest solution.
 */
export const makeNumberContentView = ({
  content,
  isRevealed,
  youId
}: {
  content: MakeNumberContent
  isRevealed: boolean
  youId: PlayerId | null
}): Extract<RoundContent, { kind: 'makenumber' }> => {
  const nearest = [...content.calculations].flatMap(([playerId, sent]) => {
    const calculation = nearestOf({ sent, target: content.target })

    return calculation === null ? [] : [{ ...calculation, playerId }]
  })

  return {
    kind: 'makenumber',
    revealedCalculations: isRevealed
      ? nearest.map(({ playerId, steps }) => ({ playerId, steps }))
      : null,
    solution: isRevealed ? content.solution : null,
    target: content.target,
    tiles: content.tiles,
    values: nearest.map(({ playerId, value }) => ({ playerId, value })),
    yourCalculations:
      youId === null
        ? null
        : (content.calculations.get(youId) ?? []).map(({ steps }) => steps)
  }
}
