import type { QuantityFamily } from '@melee/protocol/estimate'
import type {
  HigherLowerPicks,
  ValuedHigherLowerPair
} from '@melee/protocol/higher-lower'
import type { PairsVerdict } from '@melee/protocol/scoring'

import { higherSideOf } from '@melee/core/higherlower/pair-deal'

import type { Round } from '@/domain/room/room'

type HigherLowerContent = Extract<Round['content'], { kind: 'higherlower' }>

type BankedQuantity = {
  family: QuantityFamily
  names: ValuedHigherLowerPair['left']
  value: number
}

/** A pair the bank dealt, asked in its family's words, each side where the deal put it. */
export const bankedPairOf = ({
  left,
  right
}: {
  left: BankedQuantity
  right: BankedQuantity
}): ValuedHigherLowerPair => ({
  ask: { family: left.family, kind: 'bank' },
  left: left.names,
  leftValue: left.value,
  right: right.names,
  rightValue: right.value
})

/** A round on these pairs. */
export const higherLowerContent = (
  pairs: readonly ValuedHigherLowerPair[]
): HigherLowerContent => ({
  kind: 'higherlower',
  pairs: [...pairs],
  sheets: []
})

export const gradePicks = ({
  content,
  picks
}: {
  content: HigherLowerContent
  picks: HigherLowerPicks
}): PairsVerdict => ({
  kind: 'pairs',
  rightPairs: content.pairs.filter(
    ({ leftValue, rightValue }, index) =>
      picks[index] ===
      higherSideOf({ left: { value: leftValue }, right: { value: rightValue } })
  ).length
})
