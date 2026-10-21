import type { TeamId, TeamsSettings } from '@melee/protocol/team'

/**
 * How many teams a setting deals the seats into. `teamsOnly` deals none: it
 * opens a team per seat as the seats arrive, so its count is the room's.
 */
export const teamCountOf = (teams: TeamsSettings): number =>
  teams.kind === 'drawn' || teams.kind === 'chosen' ? teams.count : 0

/** Positional, so the third team is the third team whichever setting made it. */
export const teamIdAt = (index: number): TeamId => `team-${index + 1}`
