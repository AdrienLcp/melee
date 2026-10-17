import type { TeamId, TeamsSettings } from '@melee/protocol/team'

/**
 * How many teams the server keeps for a setting. `teamsOnly` keeps none: each
 * of its teams is one seat named after itself, so the seats are the teams.
 */
export const teamCountOf = (teams: TeamsSettings): number =>
  teams.kind === 'drawn' || teams.kind === 'chosen' ? teams.count : 0

/** Positional, so the third team is the third team whichever setting made it. */
export const teamIdAt = (index: number): TeamId => `team-${index + 1}`
