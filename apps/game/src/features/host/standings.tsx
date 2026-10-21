import type React from 'react'
import { useId } from 'react'

import type { BoardSettings } from '@melee/protocol/board'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { isEveryTeamItsOwnSeat } from '@melee/core/team/team-board'

import { Scoreboard } from '@/presentation/components/scoreboard'
import { TeamRoster } from '@/presentation/components/team-roster'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { TeamMove } from './team-move'

type StandingsProps = {
  /**
   * The track the teams walk, read under each team's head. Omitted or off, the
   * trays carry their score alone.
   */
  board?: BoardSettings
  /** Walks a team's pawn a case either way; absent on a screen that moves nothing. */
  onAdjust?: (team: Team, cases: 1 | -1) => void
  players: readonly PublicPlayer[]
  /** Ranked in the seats' place when the room plays in teams, the seats under them. */
  teams: readonly Team[]
  /** The seated host's own row, highlighted; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/**
 * How many rows the standings take, which the boxed layouts divide their height
 * by: a team is its name and a row of its seats, so a room in teams is two rows
 * a team rather than one a seat — three where the board reads its pawn's case,
 * and one fewer where each team is a seat of its own and draws no seats.
 */
export const standingsRowsOf = ({
  board,
  players,
  teams
}: Pick<StandingsProps, 'board' | 'players' | 'teams'>): number => {
  if (teams.length === 0) {
    return players.length
  }

  const seatRows = isEveryTeamItsOwnSeat({ players, teams }) ? 0 : 1

  return teams.length * (1 + seatRows + (board?.kind === 'track' ? 1 : 0))
}

/**
 * The game so far, beside the round that just moved it: a titled board whose
 * pawns are the ones standing on the track around it.
 */
export const Standings: React.FC<StandingsProps> = ({
  board,
  onAdjust,
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
          teamDetail={
            board?.kind === 'track'
              ? (team) => (
                  <TeamMove
                    length={board.length}
                    onAdjust={
                      onAdjust === undefined
                        ? undefined
                        : (cases) => {
                            onAdjust(team, cases)
                          }
                    }
                    team={team}
                  />
                )
              : undefined
          }
          teams={teams}
          youId={youId}
        />
      ) : (
        <Scoreboard hasPawns players={players} youId={youId} />
      )}
    </section>
  )
}
