import type { PlayerId } from '@melee/protocol/identifiers'
import type { MostLikelyCount } from '@melee/protocol/most-likely'
import { MOST_A_ROUND_PAYS } from '@melee/protocol/scoring'

/**
 * The fewest ballots a seat needs to be the room's choice: a round where every
 * ballot went somewhere different chose nobody.
 */
export const FEWEST_VOTES_TO_CHOOSE = 2

/** What a ballot for the room's choice pays: the whole round. */
export const POINTS_FOR_VOTING_WITH_THE_ROOM = MOST_A_ROUND_PAYS

/** Who voted for each seat, the most voted first, the seats nobody voted for left out. */
export const tallyBallots = (
  ballots: readonly { playerId: PlayerId; seatId: PlayerId }[]
): MostLikelyCount[] => {
  const voters = new Map<PlayerId, PlayerId[]>()

  for (const { playerId, seatId } of ballots) {
    voters.set(seatId, [...(voters.get(seatId) ?? []), playerId])
  }

  return [...voters]
    .map(([playerId, voterIds]) => ({ playerId, voterIds }))
    .toSorted((a, b) => b.voterIds.length - a.voterIds.length)
}

/** The seat or seats tied on the most ballots, and none below `FEWEST_VOTES_TO_CHOOSE`. */
export const roomsChoice = (tally: readonly MostLikelyCount[]): PlayerId[] => {
  const most = Math.max(0, ...tally.map(({ voterIds }) => voterIds.length))

  return most < FEWEST_VOTES_TO_CHOOSE
    ? []
    : tally
        .filter(({ voterIds }) => voterIds.length === most)
        .map(({ playerId }) => playerId)
}
