import type React from 'react'
import { useId } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { Scoreboard } from '@/presentation/components/scoreboard'
import { TeamRoster } from '@/presentation/components/team-roster'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type StandingsProps = {
  players: readonly PublicPlayer[]
  /** Ranked in the seats' place when the room plays in teams, the seats under them. */
  teams: readonly Team[]
  /** The seated host's own row, highlighted; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/**
 * The game so far, beside the round that just moved it: a titled board whose
 * pawns are the ones standing on the track around it.
 */
export const Standings: React.FC<StandingsProps> = ({
  players,
  teams,
  youId
}) => {
  const translate = useTranslate()
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className='standings'>
      <h2 className='standings-title' id={titleId}>
        {translate('host.standings')}
      </h2>
      {teams.length > 0 ? (
        <TeamRoster
          isRanked
          label={translate('host.standings')}
          players={players}
          teams={teams}
          youId={youId}
        />
      ) : (
        <Scoreboard hasPawns players={players} youId={youId} />
      )}
    </section>
  )
}
