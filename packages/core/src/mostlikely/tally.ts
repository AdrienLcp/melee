import type { PlayerId } from '@melee/protocol/identifiers'
import type { MostLikelyCount } from '@melee/protocol/most-likely'
import { POINTS_FOR_A_CLAIM } from '@melee/protocol/scoring'

/**
 * The fewest ballots a seat needs to be the room's choice: a round where every
 * ballot went somewhere different chose nobody.
 */
export const FEWEST_VOTES_TO_CHOOSE = 2

/** What a ballot for the room's choice pays, a claim's price. */
export const POINTS_FOR_VOTING_WITH_THE_ROOM = POINTS_FOR_A_CLAIM

/** How many ballots each seat drew, most first, the seats nobody voted for left out. */
export const tallyBallots = (
  ballots: readonly { seatId: PlayerId }[]
): MostLikelyCount[] => {
  const votes = new Map<PlayerId, number>()

  for (const { seatId } of ballots) {
    votes.set(seatId, (votes.get(seatId) ?? 0) + 1)
  }

  return [...votes]
    .map(([playerId, count]) => ({ playerId, votes: count }))
    .toSorted((a, b) => b.votes - a.votes)
}

/** The seat or seats tied on the most ballots, and none below `FEWEST_VOTES_TO_CHOOSE`. */
export const roomsChoice = (tally: readonly MostLikelyCount[]): PlayerId[] => {
  const most = Math.max(0, ...tally.map(({ votes }) => votes))

  return most < FEWEST_VOTES_TO_CHOOSE
    ? []
    : tally
        .filter(({ votes }) => votes === most)
        .map(({ playerId }) => playerId)
}
