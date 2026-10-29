import type {
  HigherLowerPicks,
  ValuedHigherLowerPair
} from '@melee/protocol/higher-lower'
import type { PairsVerdict } from '@melee/protocol/scoring'

import { higherSideOf } from '@melee/core/higherlower/pair-deal'

import type { Round } from '@/domain/room/room'

type HigherLowerContent = Extract<Round['content'], { kind: 'higherlower' }>

type BankedQuantity = Pick<ValuedHigherLowerPair, 'family'> & {
  names: ValuedHigherLowerPair['left']
  value: number
}

/** A round on these pairs, each side where the deal put it. */
export const higherLowerContent = (
  pairs: readonly { left: BankedQuantity; right: BankedQuantity }[]
): HigherLowerContent => ({
  kind: 'higherlower',
  pairs: pairs.map(({ left, right }) => ({
    family: left.family,
    left: left.names,
    leftValue: left.value,
    right: right.names,
    rightValue: right.value
  })),
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
