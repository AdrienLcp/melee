import type { CountVerdict } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'

type Counts = Pick<CountVerdict, 'bestHits' | 'hits'>

/** The round's best count, nought for a round nobody hit or nobody played. */
export const bestHitsOf = (hits: readonly number[]): number =>
  Math.max(0, ...hits)

/**
 * A seat's hits as a share of the round's best: the best seat banks the whole
 * round, half the best banks half, and a round nobody hit pays nobody. No
 * clock settles a tie — two seats on thirty hits did the same thing.
 */
export const pointsForCount = ({ bestHits, hits }: Counts): number =>
  bestHits === 0 ? 0 : paidShare(hits / bestHits)

/** Whether a seat matched the round's best, the only count that banks the whole round. */
export const isBestCount = ({ bestHits, hits }: Counts): boolean =>
  hits > 0 && hits >= bestHits
