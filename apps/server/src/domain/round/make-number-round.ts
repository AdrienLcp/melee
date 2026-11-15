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

import type { Lean, Round, SentCalculation } from '@/domain/room/room'

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
 * The value a seat stands on while the round runs: its nearest sent
 * calculation's, or what its screen holds unsent when that is strictly nearer,
 * because the close banks that lean in its place. `null` while it holds
 * neither.
 */
export const heldValueOf = ({
  content,
  lean,
  sent
}: {
  content: MakeNumberContent
  lean: Lean | undefined
  sent: readonly SentCalculation[]
}): number | null => {
  const sentValue = nearestOf({ sent, target: content.target })?.value ?? null
  const leanValue =
    lean?.graded.verdict.kind === 'calculation'
      ? lean.graded.verdict.value
      : null

  if (leanValue === null) {
    return sentValue
  }

  return sentValue === null ||
    Math.abs(leanValue - content.target) < Math.abs(sentValue - content.target)
    ? leanValue
    : sentValue
}

/** The value a seat shows every screen in this round, or `null` when it holds none — see `heldValueOf`. */
export const seatValueOf = ({
  playerId,
  round
}: {
  playerId: PlayerId
  round: Round
}): number | null =>
  round.content.kind === 'makenumber'
    ? heldValueOf({
        content: round.content,
        lean: round.leans.get(playerId),
        sent: round.content.calculations.get(playerId) ?? []
      })
    : null

/**
 * The round as a seat, the wall or a seated console reads it. Every screen
 * reads the tiles, the target and each seat's value — sent or still on its
 * screen, never the steps; the reader reads its own calculations, and the
 * reveal spells out every seat's beside the draw's shortest solution.
 */
export const makeNumberContentView = ({
  content,
  isRevealed,
  leans,
  youId
}: {
  content: MakeNumberContent
  isRevealed: boolean
  /** What each seat's screen holds unsent: drawn while the round runs, and banked or dropped by its reveal. */
  leans: ReadonlyMap<PlayerId, Lean>
  youId: PlayerId | null
}): Extract<RoundContent, { kind: 'makenumber' }> => {
  const nearest = [...content.calculations].flatMap(([playerId, sent]) => {
    const calculation = nearestOf({ sent, target: content.target })

    return calculation === null ? [] : [{ ...calculation, playerId }]
  })
  const seats = new Set([
    ...content.calculations.keys(),
    ...(isRevealed ? [] : leans.keys())
  ])
  const values = [...seats].flatMap((playerId) => {
    const value = heldValueOf({
      content,
      lean: isRevealed ? undefined : leans.get(playerId),
      sent: content.calculations.get(playerId) ?? []
    })

    return value === null ? [] : [{ playerId, value }]
  })

  return {
    kind: 'makenumber',
    revealedCalculations: isRevealed
      ? nearest.map(({ playerId, steps }) => ({ playerId, steps }))
      : null,
    solution: isRevealed ? content.solution : null,
    target: content.target,
    tiles: content.tiles,
    values,
    yourCalculations:
      youId === null
        ? null
        : (content.calculations.get(youId) ?? []).map(({ steps }) => steps)
  }
}
