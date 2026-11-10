import {
  MOST_A_ROUND_PAYS,
  type PlaceVerdict,
  POINT
} from '@melee/protocol/scoring'

/**
 * What the three fastest reactions of a heat are paid, fastest first. A
 * podium rather than the fastest alone, because a few milliseconds part the
 * first two presses — less than two phones' Wi-Fi differ by — and paying all
 * or nothing on that gap pays the network. Sixty and thirty walk a pawn two
 * cases and one at `POINTS_PER_CASE`, beside the winner's three.
 */
const PODIUM_PAYS = [MOST_A_ROUND_PAYS, 60 * POINT, 30 * POINT] as const

export const REFLEX_PODIUM_SIZE = PODIUM_PAYS.length

export const pointsForPlace = ({
  place
}: Pick<PlaceVerdict, 'place'>): number => PODIUM_PAYS[place] ?? 0

export const isFirstPlace = ({ place }: Pick<PlaceVerdict, 'place'>): boolean =>
  place === 0
