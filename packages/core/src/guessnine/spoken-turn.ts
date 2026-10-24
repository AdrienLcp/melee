import type { PlayerId } from '@melee/protocol/identifiers'
import type { TeamId } from '@melee/protocol/team'

/** A team as a spoken round draws from it: its seats that can answer, in the room's order. */
export type SpokenTeam = {
  id: TeamId
  seatIds: readonly PlayerId[]
}

/** Who says the answers this round, and the seat of another team that ticks them. */
export type SpokenTurn = {
  guessingTeamId: TeamId
  keeperId: PlayerId
}

/**
 * The next spoken round's turn: the team that has guessed least, then the seat
 * of another team that has kept least — so every team guesses as often as
 * every other and every seat keeps before any keeps twice. Ties fall to the
 * room's order, the keepers' round the table — each team's first seat, then
 * each team's second — so one team is not emptied of keepers before the next
 * is called. `null` when fewer than two teams hold a seat.
 */
export const drawSpokenTurn = ({
  guessesByTeam,
  keepsBySeat,
  teams
}: {
  guessesByTeam: ReadonlyMap<TeamId, number>
  keepsBySeat: ReadonlyMap<PlayerId, number>
  teams: readonly SpokenTeam[]
}): SpokenTurn | null => {
  const seated = teams.filter((team) => team.seatIds.length > 0)

  const guessing = seated.reduce<SpokenTeam | null>(
    (best, team) =>
      best === null ||
      (guessesByTeam.get(team.id) ?? 0) < (guessesByTeam.get(best.id) ?? 0)
        ? team
        : best,
    null
  )

  if (guessing === null) {
    return null
  }

  const others = seated.filter((team) => team.id !== guessing.id)
  const depth = Math.max(0, ...others.map((team) => team.seatIds.length))
  const keepers = Array.from({ length: depth }, (_, rank) =>
    others.flatMap((team) => team.seatIds[rank] ?? [])
  ).flat()

  const keeperId = keepers.reduce<PlayerId | null>(
    (best, seatId) =>
      best === null ||
      (keepsBySeat.get(seatId) ?? 0) < (keepsBySeat.get(best) ?? 0)
        ? seatId
        : best,
    null
  )

  return keeperId === null ? null : { guessingTeamId: guessing.id, keeperId }
}
