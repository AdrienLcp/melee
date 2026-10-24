import type { TeamId, TeamsSettings } from '@melee/protocol/team'

/** How many teams a setting deals the seats into. */
export const teamCountOf = (teams: TeamsSettings): number =>
  teams.kind === 'off' ? 0 : teams.count

/** Positional, so the third team is the third team whichever setting made it. */
export const teamIdAt = (index: number): TeamId => `team-${index + 1}`

/**
 * How many teams a table of `seated` splits into before the host says
 * otherwise: two up to seven, three up to eleven, four beyond — teams of three
 * to four, small enough that everyone in one gets a word in.
 */
export const suggestedTeamCount = (seated: number): number => {
  if (seated <= 7) {
    return 2
  }

  return seated <= 11 ? 3 : 4
}

/**
 * The smallest table sides change anything for: two against one. Under it,
 * two teams are two players dressed as teams, or one player beside an empty
 * team.
 */
export const MIN_SEATS_FOR_TEAMS = 3

/**
 * Whether a table plays in the teams its setting asked for once every seat is
 * placed: enough seats, and at least two teams holding one, so no screen ever
 * shows a team nobody is in.
 */
export const fieldsTeams = ({
  filledTeamCount,
  seatCount
}: {
  filledTeamCount: number
  seatCount: number
}): boolean => seatCount >= MIN_SEATS_FOR_TEAMS && filledTeamCount >= 2
