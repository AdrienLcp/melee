import type React from 'react'
import { useId } from 'react'

import type { BoardSettings } from '@melee/protocol/board'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer } from '@melee/protocol/room'
import type { Team, TeamId } from '@melee/protocol/team'

import { trackPawnsOf } from '@melee/core/board/track-pawns'
import { isEveryTeamItsOwnSeat } from '@melee/core/team/team-board'

import { Scoreboard } from '@/presentation/components/scoreboard'
import { TeamRoster } from '@/presentation/components/team-roster'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import { TeamMove } from './team-move'
import { TrackPodium } from './track-podium'

type StandingsProps = {
  /**
   * The track the teams walk, read under each team's head. Omitted or off, the
   * trays carry their score alone.
   */
  board?: BoardSettings
  /** Walks a team's pawn a case either way; absent on a screen that moves nothing. */
  onAdjust?: (team: Team, cases: 1 | -1) => void
  players: readonly PublicPlayer[]
  /** The order before the round moved it, which the rows and trays travel from. */
  rankedBefore?: StandingBefore | null
  /** Ranked in the seats' place when the room plays in teams, the seats under them. */
  teams: readonly Team[]
  /** The seated host's own row, highlighted; `null` on a screen nobody sits at. */
  youId: PlayerId | null
}

/** The seats' and the teams' order, each by id, as the board last ranked them. */
export type StandingBefore = {
  seats: readonly PlayerId[]
  teams: readonly TeamId[]
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
  rankedBefore,
  teams,
  youId
}) => {
  const translate = useTranslate()
  const titleId = useId()
  const teamName = useTeamName()
  const seatPawns =
    teams.length === 0 && board?.kind === 'track'
      ? trackPawnsOf({ players, teams })
      : []

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
          rankedBefore={rankedBefore?.teams}
          teamDetail={
            board?.kind === 'track'
              ? (team) => (
                  <TeamMove
                    length={board.length}
                    name={teamName(team)}
                    onAdjust={
                      onAdjust === undefined
                        ? undefined
                        : (cases) => {
                            onAdjust(team, cases)
                          }
                    }
                    position={team.board}
                  />
                )
              : undefined
          }
          teams={teams}
          youId={youId}
        />
      ) : seatPawns.length > 0 ? (
        <TrackPodium pawns={seatPawns} youId={youId} />
      ) : (
        <Scoreboard
          hasPawns
          players={players}
          rankedBefore={rankedBefore?.seats}
          youId={youId}
        />
      )}
    </section>
  )
}
