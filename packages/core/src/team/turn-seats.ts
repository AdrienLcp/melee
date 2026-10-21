import type { PlayerId } from '@melee/protocol/identifiers'
import type { TeamId } from '@melee/protocol/team'

/** A team as a turn sees it: who sits in it, in the room's order. */
export type TeamSeats = {
  id: TeamId
  seatIds: readonly PlayerId[]
}

/** Two seats of two teams, head to head, in the order they were drawn. */
export type Duel = {
  seatIds: PlayerId[]
  teamIds: TeamId[]
}

type Seat = {
  seatId: PlayerId
  teamId: TeamId
}

/**
 * The seat answering for its team in a solo set: one further down the team
 * every set, so everybody answers in turn before anyone answers twice.
 */
export const soloSeat = ({
  seatIds,
  setsPlayed
}: {
  seatIds: readonly PlayerId[]
  setsPlayed: number
}): PlayerId | null => seatIds[setsPlayed % seatIds.length] ?? null

/**
 * Every seat dealt round the table — each team's first, then each team's
 * second — so a tie on duels played falls across the teams rather than
 * emptying one team before the next is called.
 */
const roundTheTable = (teams: readonly TeamSeats[]): Seat[] => {
  const depth = Math.max(0, ...teams.map((team) => team.seatIds.length))

  return Array.from({ length: depth }, (_, rank) =>
    teams.flatMap((team) => {
      const seatId = team.seatIds[rank]

      return seatId === undefined ? [] : [{ seatId, teamId: team.id }]
    })
  ).flat()
}

/**
 * The next duel: the seat that has duelled least, against the seat of another
 * team that has duelled least, so every seat duels before anyone duels twice
 * wherever the teams' sizes allow it. `null` when no two teams hold a seat.
 */
export const drawDuel = ({
  duelsBySeat,
  teams
}: {
  duelsBySeat: ReadonlyMap<PlayerId, number>
  teams: readonly TeamSeats[]
}): Duel | null => {
  const duelsOf = (seat: Seat) => duelsBySeat.get(seat.seatId) ?? 0

  const fewest = (seats: readonly Seat[]) =>
    seats.reduce<Seat | null>(
      (best, seat) =>
        best === null || duelsOf(seat) < duelsOf(best) ? seat : best,
      null
    )

  const seats = roundTheTable(teams)
  const first = fewest(seats)

  if (first === null) {
    return null
  }

  const second = fewest(seats.filter((seat) => seat.teamId !== first.teamId))

  if (second === null) {
    return null
  }

  return {
    seatIds: [first.seatId, second.seatId],
    teamIds: [first.teamId, second.teamId]
  }
}
