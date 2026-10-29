import { HIGHER_LOWER_PAIR_COUNT } from '@melee/protocol/higher-lower'
import {
  type PairsVerdict,
  POINTS_FOR_A_RIGHT_CHOICE
} from '@melee/protocol/scoring'

/**
 * A pick's price per pair picked the right way: each pair is a choice of two,
 * so it is paid as one, and the clock adds to the whole sheet on top.
 */
export const pointsForPairs = ({
  rightPairs
}: Pick<PairsVerdict, 'rightPairs'>): number =>
  rightPairs * POINTS_FOR_A_RIGHT_CHOICE

export const isWholeSheetRight = ({
  rightPairs
}: Pick<PairsVerdict, 'rightPairs'>): boolean =>
  rightPairs === HIGHER_LOWER_PAIR_COUNT
