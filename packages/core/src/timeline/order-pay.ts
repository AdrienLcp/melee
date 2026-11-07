import type { OrderVerdict } from '@melee/protocol/scoring'

import { thirdsOfARound } from '../scoring/round-share'

type OrderTier = { points: number; withinSwappedPairs: number }

/**
 * What an order earns by how many pairs it puts the wrong way round. Data
 * rather than a formula, like the map's distances, because it is a table's
 * sense of "nearly": the whole order is the whole round, one
 * neighbour swapped still pays, and a shuffle that happens to get half the
 * pairs right pays nothing — five events dealt at random already average five.
 */
export const ORDER_TIERS = [
  { points: thirdsOfARound(3), withinSwappedPairs: 0 },
  { points: thirdsOfARound(2), withinSwappedPairs: 1 },
  { points: thirdsOfARound(1), withinSwappedPairs: 2 }
] satisfies readonly OrderTier[]

/** What an order this far from the true one earns, before the clock takes its share. */
export const pointsForOrder = ({
  swappedPairs
}: Pick<OrderVerdict, 'swappedPairs'>): number =>
  ORDER_TIERS.find(
    ({ withinSwappedPairs }: OrderTier) => swappedPairs <= withinSwappedPairs
  )?.points ?? 0

export const isPerfectOrder = ({
  swappedPairs
}: Pick<OrderVerdict, 'swappedPairs'>): boolean => swappedPairs === 0

/**
 * The pairs of `sent` that `trueOrder` has the other way round, or `null` when
 * `sent` is not the same events once each — a frame that is not an answer to
 * this round.
 */
export const swappedPairsOf = <TId>({
  sent,
  trueOrder
}: {
  sent: readonly TId[]
  trueOrder: readonly TId[]
}): number | null => {
  const rankOf = new Map(trueOrder.map((id, rank) => [id, rank]))
  const ranks = sent.flatMap((id) => {
    const rank = rankOf.get(id)

    return rank === undefined ? [] : [rank]
  })

  if (
    sent.length !== trueOrder.length ||
    new Set(sent).size !== sent.length ||
    ranks.length !== sent.length
  ) {
    return null
  }

  let swapped = 0

  for (const [index, rank] of ranks.entries()) {
    for (const later of ranks.slice(index + 1)) {
      if (rank > later) {
        swapped += 1
      }
    }
  }

  return swapped
}
