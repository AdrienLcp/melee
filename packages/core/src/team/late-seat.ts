import type { TeamId } from '@melee/protocol/team'

type TeamHeadcount = {
  /** Seats behind a screen right now: a team whose phones went dark is short, whatever its roster says. */
  connectedSeatCount: number
  id: TeamId
}

/**
 * Where a seat without a team goes: the team with the fewest connected seats,
 * the first of them on a tie. Decided on the server and in team order, so every
 * screen agrees on where the latecomer sat down without anyone being asked.
 */
export const teamForLateSeat = (
  teams: readonly TeamHeadcount[]
): TeamId | null =>
  teams.reduce<TeamHeadcount | null>(
    (smallest, team) =>
      smallest === null || team.connectedSeatCount < smallest.connectedSeatCount
        ? team
        : smallest,
    null
  )?.id ?? null
