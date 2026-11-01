import type React from 'react'

import type { PlayerClientMessage } from '@melee/protocol/client-message'
import type { PlayerRoomView } from '@melee/protocol/room'

import {
  buildTeamBoard,
  hasAnyTeamScored,
  isEveryTeamItsOwnSeat,
  teamOfSeat
} from '@melee/core/team/team-board'

import { Button } from '@/presentation/components/button'
import { OwnPawnPress } from '@/presentation/components/own-pawn-press'
import { Pawn } from '@/presentation/components/pawn'
import { SeatPodium } from '@/presentation/components/seat-podium'
import { SectionHeading } from '@/presentation/components/section-heading'
import { TeamMove } from '@/presentation/components/team-move'
import { TeamRoster } from '@/presentation/components/team-roster'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useTeamName } from '@/presentation/i18n/use-team-name'

import './player-teams.sass'
import { shownPoints } from '@/helpers/shown-points'

/** What a seat may say about its own team: which one it sits in. */
export type TeamSeatMessage = Extract<
  PlayerClientMessage,
  { type: 'player.chooseTeam' }
>

type LobbyTeamsProps = {
  /** `false` from the socket means the frame was never written. */
  onTeam: (message: TeamSeatMessage) => boolean
  view: PlayerRoomView
}

/**
 * The table as teams, on a player's own screen. Under `chosen` every other
 * team's head carries one press to join it, and switching is the same press;
 * under `drawn` the trays are read, and the player's own is the one in a
 * keyline. Either way the player's own team carries the press that repaints
 * its pawn.
 */
export const LobbyTeams: React.FC<LobbyTeamsProps> = ({ onTeam, view }) => {
  const translate = useTranslate()
  const isChosen = view.settings.teams.kind === 'chosen'
  const yours = teamOfSeat({ playerId: view.youId, teams: view.teams })

  return (
    <div className='lobby-teams'>
      {isChosen && yours === null && (
        <h2 className='pick'>{translate('team.pick')}</h2>
      )}
      <TeamRoster
        label={translate('team.title')}
        players={view.players}
        teamAction={(team) =>
          team.id === yours?.id ? (
            <OwnPawnPress />
          ) : isChosen ? (
            <Button
              className='join'
              onPress={() =>
                onTeam({ teamId: team.id, type: 'player.chooseTeam' })
              }
              size='small'
              variant={yours === null ? 'filled' : 'outlined'}
            >
              {translate('team.join')}
            </Button>
          ) : null
        }
        teams={view.teams}
        unassignedLabel={translate(
          isChosen ? 'team.unassigned.chosen' : 'team.unassigned.drawn'
        )}
        youId={view.youId}
      />
    </div>
  )
}

/**
 * Where this player's team finished, and the teams ranked with their seats
 * under them — in a team game the place a phone owes its player is the
 * team's, and their own name is found in the tray. The best three seats
 * stand on their own podium between the two.
 */
export const TeamFinish: React.FC<{ view: PlayerRoomView }> = ({ view }) => {
  const translate = useTranslate()
  const teamName = useTeamName()
  const { board } = view.settings
  const yours = teamOfSeat({ playerId: view.youId, teams: view.teams })
  const placing = buildTeamBoard(view.teams).find(
    (entry) => entry.team.id === yours?.id
  )

  return (
    <>
      {placing !== undefined && hasAnyTeamScored(view.teams) && (
        <div className='your-placing'>
          <Pawn colour={placing.team.colour} />
          <p className='your-rank'>
            <VisuallyHidden elementType='span'>
              {`${teamName(placing.team)} `}
            </VisuallyHidden>
            {translate('player.final.rank', { rank: placing.rank })}
          </p>
          <p className='your-total'>
            {placing.team.board !== null && (
              <span className='case'>
                {translate('board.at', { case: placing.team.board.case })}
              </span>
            )}
            <span className='value'>
              {translate('player.score', {
                points: shownPoints(placing.team.score)
              })}
            </span>{' '}
            {translate('player.points', {
              points: shownPoints(placing.team.score)
            })}
          </p>
        </div>
      )}
      {!isEveryTeamItsOwnSeat(view) && (
        <SeatPodium players={view.players} youId={view.youId} />
      )}
      <SectionHeading>{translate('round.finalStandings')}</SectionHeading>
      <TeamRoster
        isRanked
        label={translate('round.finalStandings')}
        players={view.players}
        teamDetail={
          board.kind === 'track'
            ? (team) => (
                <TeamMove
                  length={board.length}
                  name={teamName(team)}
                  position={team.board}
                />
              )
            : undefined
        }
        teams={view.teams}
        youId={view.youId}
      />
    </>
  )
}
