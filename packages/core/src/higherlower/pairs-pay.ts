import { HIGHER_LOWER_PAIR_COUNT } from '@melee/protocol/higher-lower'
import type { PairsVerdict } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'

/**
 * A sheet's share per pair picked the right way: its pairs are one round
 * together, and the clock takes its share of the whole sheet.
 */
export const pointsForPairs = ({
  rightPairs
}: Pick<PairsVerdict, 'rightPairs'>): number =>
  paidShare(rightPairs / HIGHER_LOWER_PAIR_COUNT)

export const isWholeSheetRight = ({
  rightPairs
}: Pick<PairsVerdict, 'rightPairs'>): boolean =>
  rightPairs === HIGHER_LOWER_PAIR_COUNT
