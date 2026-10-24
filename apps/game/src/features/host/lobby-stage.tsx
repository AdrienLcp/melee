import type React from 'react'

import type { PlayerId, RoomCode } from '@melee/protocol/identifiers'
import type { HostRoomView } from '@melee/protocol/room'

import { trackPawnsOf } from '@melee/core/board/track-pawns'
import { isShelvedGame } from '@melee/core/room/shelved-game'
import { teamCountOf } from '@melee/core/team/team-count'

import { Button } from '@/presentation/components/button'
import { EmptySockets } from '@/presentation/components/empty-sockets'
import { RoomInvitation } from '@/presentation/components/room-invitation'
import { Scoreboard } from '@/presentation/components/scoreboard'
import { TeamRoster } from '@/presentation/components/team-roster'
import { TrackStrip } from '@/presentation/components/track-strip'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  gameDescriptionKey,
  gameNameKey,
  scoringKey
} from '@/presentation/i18n/translation'

import { MoveSeat } from './move-seat'
import { NumberChoice } from './number-choice'
import { RenameTeam } from './rename-team'
import type { StageControls } from './room-stage'
import { SlatePreparation } from './slate-preparation'
import { TEAM_COUNTS } from './teams-setup'
import { useTeamCountFollowingHeadcount, useTeamDeal } from './use-team-deal'

/** As many pawns as a box holds: the roster shows an empty socket for each one still in it. */
type LobbyStageProps = {
  /** `null` on the wall, which shows who has arrived and what they will play. */
  controls: StageControls | null
  roomCode: RoomCode
  view: HostRoomView
  /** The seat this console took; `null` on the wall and on an unseated console. */
  youId: PlayerId | null
}

/**
 * The room's front door, on the screen everyone is looking at: the code to read
 * aloud, the QR to scan, who has arrived so far — and what they are about to
 * play, which is the one decision the room is waiting on.
 *
 * The two columns are two audiences. The invitation is what the room is
 * reading; the roster is the host's own — and on the wall, with the game's
 * name and pitch above it, the room's too. The console chooses the game in its
 * panel, beside the stage rather than on it.
 */
export const LobbyStage: React.FC<LobbyStageProps> = ({
  controls,
  roomCode,
  view,
  youId
}) => {
  const translate = useTranslate()
  const playsAloud = view.settings.teams.kind === 'aloud'

  useTeamCountFollowingHeadcount({ controls, view })

  return (
    <div className='stage lobby' data-aloud={playsAloud || undefined}>
      {/* Nobody joins a table answering aloud, so there is nothing to scan. */}
      {!playsAloud && (
        <RoomInvitation isUnattended={controls === null} roomCode={roomCode} />
      )}

      <div className='host-side'>
        {controls === null && (
          <section className='game-choice'>
            {view.settings.game !== null && (
              <h2 className='game-name'>
                {translate(gameNameKey(view.settings.game.kind))}
              </h2>
            )}
            <GamePitch isUnattended view={view} />
          </section>
        )}

        {controls !== null && view.settings.game?.kind === 'slate' && (
          <SlatePreparation
            game={view.settings.game}
            isLive={controls.isLive}
            onChange={controls.onSettingsChange}
            onPrepareKey={controls.onRememberSlateKey}
            preparedKeys={controls.preparedSlateKeys}
            settings={view.settings}
          />
        )}

        {view.settings.board.kind === 'track' && (
          <section className='board-preview'>
            <h2>{translate('board.setting.label')}</h2>
            <TrackStrip
              length={view.settings.board.length}
              pawns={trackPawnsOf(view)}
              yours={undefined}
            />
          </section>
        )}

        <section className='roster'>
          {playsAloud ? (
            <h2>{translate('team.title')}</h2>
          ) : (
            <h2>
              {translate('host.players.count', {
                count: view.players.length
              })}
            </h2>
          )}
          {playsAloud ? (
            <LobbyTeams controls={controls} view={view} youId={youId} />
          ) : view.players.length === 0 ? null : view.teams.length > 0 ? (
            <LobbyTeams controls={controls} view={view} youId={youId} />
          ) : (
            <Scoreboard
              hasPawns
              onRemove={controls?.onRemovePlayer}
              players={view.players}
              youId={youId}
            />
          )}
          {view.teams.length === 0 && (
            <EmptySockets seated={view.players.length} />
          )}
        </section>
      </div>
    </div>
  )
}

/**
 * The roster dealt into its teams. The console deals them — the draw is a
 * shuffle on this screen, checked by the server — names them and moves a seat
 * between them; the wall shows the same trays and touches nothing.
 *
 * The count is set here, beside the draw; `useTeamCountFollowingHeadcount`
 * keeps it in step with the room.
 */
const LobbyTeams: React.FC<{
  controls: StageControls | null
  view: HostRoomView
  youId: PlayerId | null
}> = ({ controls, view, youId }) => {
  const translate = useTranslate()
  const teams = view.settings.teams
  const { deal, hasDealt, isDrawn, isShortOfPlayers } = useTeamDeal({
    send: controls?.send ?? null,
    view
  })

  return (
    <>
      {controls !== null && teams.kind !== 'off' && (
        <div className='team-deal'>
          <NumberChoice
            className='team-count'
            isDisabled={!controls.isLive}
            label={translate('team.count')}
            onChange={(count) => {
              controls.onSettingsChange({
                ...view.settings,
                teams: { ...teams, count }
              })
            }}
            optionLabel={String}
            options={TEAM_COUNTS}
            value={teams.count}
          />
          {isDrawn && (
            <Button
              className='draw-teams'
              isDisabled={!controls.isLive || isShortOfPlayers}
              onPress={deal}
              variant={hasDealt ? 'outlined' : 'filled'}
            >
              {translate(hasDealt ? 'team.redraw' : 'team.draw')}
            </Button>
          )}
        </div>
      )}
      {controls !== null && isShortOfPlayers && (
        <p className='draw-needs'>
          {translate('team.drawNeeds', { count: teamCountOf(teams) })}
        </p>
      )}
      <TeamRoster
        label={translate('team.title')}
        players={view.players}
        seatAction={
          controls === null
            ? undefined
            : (player) => (
                <MoveSeat
                  onMove={(teamId) => {
                    controls.send({
                      playerId: player.id,
                      teamId,
                      type: 'host.moveSeat'
                    })
                  }}
                  player={player}
                  teams={view.teams}
                />
              )
        }
        teamAction={
          controls === null
            ? undefined
            : (team) => (
                <RenameTeam
                  onRename={(name) => {
                    controls.send({
                      name,
                      teamId: team.id,
                      type: 'host.renameTeam'
                    })
                  }}
                  team={team}
                />
              )
        }
        teams={view.teams}
        unassignedLabel={translate(
          isDrawn ? 'team.unassigned.drawn' : 'team.unassigned.chosen'
        )}
        youId={youId}
      />
    </>
  )
}

/**
 * What the chosen game is and what a round of it pays. On the console the lids
 * of the shelf carry the promise, so only the wall — which has no shelf — adds
 * the pitch a game's own front door shows.
 *
 * The pitch alone was half of it. Every player in the room is told what the
 * round pays — `UpNext` prints it while the table fills up — and the one screen
 * that never was is the one whose job is to explain the game out loud: the
 * sentence was in the setup fold, which is collapsed at every width. So it is
 * here too, under the promise it is the terms of.
 */
export const GamePitch: React.FC<{
  isUnattended: boolean
  view: HostRoomView
}> = ({ isUnattended, view }) => {
  const translate = useTranslate()
  const game = view.settings.game

  if (game === null || !isShelvedGame(game.kind)) {
    return (
      <p className='prompt'>
        {translate(isUnattended ? 'player.choosingGame' : 'host.game.prompt')}
      </p>
    )
  }

  return (
    <>
      {isUnattended && (
        <p className='pitch'>{translate(gameDescriptionKey(game.kind))}</p>
      )}
      <p className='scoring'>
        {translate(
          scoringKey({
            answerMode: view.settings.mode.kind,
            asksForACity:
              game.kind === 'worldmap' && game.places === 'frenchCities',
            asksForAFilm:
              game.kind === 'blindtest' && game.source.kind === 'film',
            doublesLoneFinds:
              game.kind === 'guessnine' && game.doublesLoneFinds,
            game: game.kind
          })
        )}
      </p>
    </>
  )
}
