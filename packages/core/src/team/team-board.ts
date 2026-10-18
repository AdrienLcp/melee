import type { PlayerId } from '@melee/protocol/identifiers'
import type { Team } from '@melee/protocol/team'

export type TeamBoardEntry = {
  /** Standard competition ranking, as the seats' board ranks: two teams on 5 are both 1st. */
  rank: number
  team: Team
}

/** Whether the teams have anything to rank — the seats' threshold, met by the teams. */
export const hasAnyTeamScored = (teams: readonly Team[]): boolean =>
  teams.some((team) => team.score > 0 || caseOf(team) > 0)

const caseOf = (team: Team): number => team.board?.case ?? 0

/**
 * On a track the pawn furthest along leads and the score breaks a tie between
 * two pawns on one case: the race is what the room watched, and a host's
 * correction can leave the two a case apart.
 *
 * Ties keep the teams' own order, which is their colour order on every screen,
 * so two walls showing the same scores never disagree about who is listed first.
 */
export const buildTeamBoard = (teams: readonly Team[]): TeamBoardEntry[] => {
  const ordered = teams.toSorted(
    (left, right) => caseOf(right) - caseOf(left) || right.score - left.score
  )

  let currentRank = 0
  let previous: Team | null = null

  return ordered.map((team, index) => {
    if (
      previous === null ||
      caseOf(team) !== caseOf(previous) ||
      team.score !== previous.score
    ) {
      currentRank = index + 1
      previous = team
    }

    return { rank: currentRank, team }
  })
}

/** Every team on the top rank, and nobody while no team has scored. */
export const teamWinnersOf = (teams: readonly Team[]): Team[] =>
  hasAnyTeamScored(teams)
    ? buildTeamBoard(teams)
        .filter((entry) => entry.rank === 1)
        .map((entry) => entry.team)
    : []

export const teamOfSeat = ({
  playerId,
  teams
}: {
  playerId: PlayerId | null
  teams: readonly Team[]
}): Team | null =>
  playerId === null
    ? null
    : (teams.find((team) => team.seatIds.includes(playerId)) ?? null)
