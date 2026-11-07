import type { PlayerId } from '@melee/protocol/identifiers'
import type { NumberVerdict } from '@melee/protocol/scoring'

import { paidShare } from '../scoring/round-share'

/**
 * From this ratio either way an estimate pays nothing. Three rather than two,
 * measured against the bank: a country's area or a city's population is a
 * figure a table misses by half as often as not — Gabon's 268 000 km² against
 * a guess of 150 000 — and a cut at two would pay half the table nothing on
 * half the questions. A guess nine times off, which the podium it replaced
 * still paid in a room of three, is far past it.
 */
export const ZERO_PAY_RATIO = 3

/**
 * Within this ratio either way an estimate is spot on: 2 % of a country's
 * population is the gap between two censuses, and no table argues it.
 */
export const SPOT_ON_RATIO = 1.02

/**
 * How far an estimate fell, as the logarithm of its ratio to the truth: saying
 * 100 million for 124 is the same miss as 10 000 for 12 400, where a
 * difference would make every population question a question about the zeros.
 */
export const gapOf = (ratio: number): number => Math.abs(Math.log(ratio))

export const isSpotOn = ({ ratio }: Pick<NumberVerdict, 'ratio'>): boolean =>
  gapOf(ratio) <= Math.log(SPOT_ON_RATIO)

/**
 * What an estimate pays for its own precision: the whole round on the truth,
 * falling with the logarithm of the miss to nothing at `ZERO_PAY_RATIO` —
 * 91 at a tenth off, 80 at a quarter, 63 at half again, 37 at twice. Never by
 * its place among the room's, because a podium pays whoever is least far off,
 * however far that is.
 */
export const pointsForEstimate = ({
  ratio
}: Pick<NumberVerdict, 'ratio'>): number =>
  paidShare(1 - gapOf(ratio) / Math.log(ZERO_PAY_RATIO))

/** Every seat's verdict once the round is in: how far its guess fell from the truth. */
export const estimateVerdictsOf = ({
  guesses,
  truth
}: {
  guesses: readonly { guess: number; playerId: PlayerId }[]
  truth: number
}): Map<PlayerId, NumberVerdict> =>
  new Map(
    guesses.map(({ guess, playerId }) => [
      playerId,
      { kind: 'number', ratio: guess / truth }
    ])
  )
