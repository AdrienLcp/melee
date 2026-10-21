import type { PlayerId } from '@melee/protocol/identifiers'

type PaidSeat = {
  playerId: PlayerId
  points: number
}

/**
 * What one round pays a team: the sum of what it paid the team's seats it
 * opened on. A sum rather than a mean, because under a mean a teammate's wrong
 * answer lowers the team's result and names a culprit; under a sum every answer
 * only adds (open decision 2).
 *
 * A team that `answersAsOne` — a turn, where every seat it was stamped on holds
 * the same attempt, or a challenge's placing, paid to each of them — is paid
 * that attempt once rather than once per seat: its best seat, which is every
 * seat's.
 *
 * `openedWithPlayerIds` is `null` before the round is stamped, and every seat
 * of the team counts then — nobody is late for a round that has not started.
 */
export const teamRoundResult = ({
  answersAsOne,
  awards,
  openedWithPlayerIds,
  seatIds
}: {
  answersAsOne: boolean
  awards: readonly PaidSeat[]
  openedWithPlayerIds: ReadonlySet<PlayerId> | null
  seatIds: readonly PlayerId[]
}): number => {
  const paid = awards
    .filter(
      (award) =>
        seatIds.includes(award.playerId) &&
        (openedWithPlayerIds?.has(award.playerId) ?? true)
    )
    .map((award) => award.points)

  return answersAsOne
    ? Math.max(0, ...paid)
    : paid.reduce((total, points) => total + points, 0)
}
