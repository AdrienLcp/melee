import type { PlayerId } from '@melee/protocol/identifiers'

type PaidSeat = {
  playerId: PlayerId
  points: number
}

/**
 * What one round pays a team: the mean of what it paid the team's seats it
 * opened on, a seat that scored nothing counting as nought. A mean rather than
 * a sum, because a sum pays the team of four over the team of three for being
 * four (open decision 2).
 *
 * `openedWithPlayerIds` is `null` before the round is stamped, and every seat
 * of the team counts then — nobody is late for a round that has not started.
 * A team none of whose seats the round opened on is paid nothing rather than
 * divided by zero.
 */
export const teamRoundResult = ({
  awards,
  openedWithPlayerIds,
  seatIds
}: {
  awards: readonly PaidSeat[]
  openedWithPlayerIds: ReadonlySet<PlayerId> | null
  seatIds: readonly PlayerId[]
}): number => {
  const playing = seatIds.filter(
    (seatId) => openedWithPlayerIds?.has(seatId) ?? true
  )

  if (playing.length === 0) {
    return 0
  }

  const paid = awards
    .filter((award) => playing.includes(award.playerId))
    .reduce((total, award) => total + award.points, 0)

  return Math.round(paid / playing.length)
}
