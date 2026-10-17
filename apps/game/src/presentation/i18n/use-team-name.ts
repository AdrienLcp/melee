import type { Team } from '@melee/protocol/team'

import { useTranslate } from './i18n-provider'
import { teamColourKey } from './translation'

/**
 * A team's name on this screen: the host's, or this screen's dictionary's word
 * for the team's colour — so a French phone and an English wall each say it in
 * their own language until somebody names it.
 */
export const useTeamName = (): ((team: Team) => string) => {
  const translate = useTranslate()

  return (team) => team.name ?? translate(teamColourKey(team.colour))
}
