import type { PlayerId } from '@melee/protocol/identifiers'
import { type NumberVerdict, POINT } from '@melee/protocol/scoring'

/**
 * Beyond this ratio either way an estimate is a guess at the zeros, and pays
 * nothing even when it is the room's closest — in a room of three it would
 * otherwise take a podium place.
 */
export const OUT_OF_REACH_RATIO = 10

/**
 * Within this ratio either way an estimate is spot on: 2 % of a country's
 * population is the gap between two censuses, and no table argues it.
 */
export const SPOT_ON_RATIO = 1.02

/**
 * What the closest three places pay, ties sharing a place: the room's best
 * estimate is who the table cheers whether or not anybody knew, so the pay
 * follows the ranking rather than an absolute curve.
 */
export const ESTIMATE_PLACE_PAYS = [3 * POINT, 2 * POINT, POINT] as const

/**
 * How far an estimate fell, as the logarithm of its ratio to the truth: saying
 * 100 million for 124 is the same miss as 10 000 for 12 400, where a
 * difference would make every population question a question about the zeros.
 */
export const gapOf = (ratio: number): number => Math.abs(Math.log(ratio))

export const isWithinReach = (ratio: number): boolean =>
  gapOf(ratio) <= Math.log(OUT_OF_REACH_RATIO)

export const isSpotOn = ({ ratio }: Pick<NumberVerdict, 'ratio'>): boolean =>
  gapOf(ratio) <= Math.log(SPOT_ON_RATIO)

export const pointsForEstimate = ({
  placesFromBest
}: Pick<NumberVerdict, 'placesFromBest'>): number =>
  placesFromBest === null ? 0 : (ESTIMATE_PLACE_PAYS[placesFromBest] ?? 0)

/**
 * Every seat's verdict once the round is in. A place counts the seats strictly
 * closer, so two seats sharing the best estimate both take the first place and
 * the next one along takes the third.
 */
export const estimateVerdictsOf = ({
  guesses,
  truth
}: {
  guesses: readonly { guess: number; playerId: PlayerId }[]
  truth: number
}): Map<PlayerId, NumberVerdict> => {
  const ratios = guesses.map(({ guess, playerId }) => ({
    playerId,
    ratio: guess / truth
  }))
  const gapsInReach = ratios
    .filter(({ ratio }) => isWithinReach(ratio))
    .map(({ ratio }) => gapOf(ratio))

  return new Map(
    ratios.map(({ playerId, ratio }) => {
      const gap = gapOf(ratio)
      const placesFromBest = isWithinReach(ratio)
        ? gapsInReach.filter((other) => other < gap).length
        : null

      return [playerId, { kind: 'number', placesFromBest, ratio }] as const
    })
  )
}
