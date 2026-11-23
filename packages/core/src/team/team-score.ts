import type { PlayerId } from '@melee/protocol/identifiers'
import type { TeamScoring } from '@melee/protocol/team'

export type PaidSeat = {
  playerId: PlayerId
  points: number
}

/**
 * What one round pays a team out of what it paid the team's seats it opened
 * on: their sum, or under `balanced` their mean, rounded to a whole score.
 * The mean is over the seats the round opened on rather than the whole team,
 * so a seat that arrived late does not halve its teammates.
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
  scoring,
  seatIds
}: {
  answersAsOne: boolean
  awards: readonly PaidSeat[]
  openedWithPlayerIds: ReadonlySet<PlayerId> | null
  scoring: TeamScoring
  seatIds: readonly PlayerId[]
}): number => {
  const playingSeatIds = seatIds.filter(
    (seatId) => openedWithPlayerIds?.has(seatId) ?? true
  )
  const paid = awards
    .filter((award) => playingSeatIds.includes(award.playerId))
    .map((award) => award.points)

  if (answersAsOne) {
    return Math.max(0, ...paid)
  }

  const total = paid.reduce((sum, points) => sum + points, 0)

  return scoring === 'sum' || playingSeatIds.length === 0
    ? total
    : Math.round(total / playingSeatIds.length)
}

/**
 * Whether a team's round holds a perfect answer, read the way its result is
 * added up: a team paid its seats' sum holds one when any seat gave it, as it
 * does when the team answers as one; a team paid their mean only when every
 * seat it opened on did, since one seat short of it pulls the mean short too.
 */
export const isTeamRoundPerfect = ({
  answersAsOne,
  awards,
  openedWithPlayerIds,
  scoring,
  seatIds
}: {
  answersAsOne: boolean
  awards: readonly { isPerfect: boolean; playerId: PlayerId }[]
  openedWithPlayerIds: ReadonlySet<PlayerId> | null
  scoring: TeamScoring
  seatIds: readonly PlayerId[]
}): boolean => {
  const playingSeatIds = seatIds.filter(
    (seatId) => openedWithPlayerIds?.has(seatId) ?? true
  )
  const isPerfectSeat = (seatId: PlayerId): boolean =>
    awards.some((award) => award.playerId === seatId && award.isPerfect)

  return answersAsOne || scoring === 'sum'
    ? playingSeatIds.some(isPerfectSeat)
    : playingSeatIds.length > 0 && playingSeatIds.every(isPerfectSeat)
}
