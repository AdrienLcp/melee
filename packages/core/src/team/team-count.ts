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
