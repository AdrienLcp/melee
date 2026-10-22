import type React from 'react'

import { launchesWithHostSeated } from '@melee/core/room/play-right-away'
import { teamCountOf } from '@melee/core/team/team-count'

import { Button } from '@/presentation/components/button'
import { PlayRightAway } from '@/presentation/components/play-right-away'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { PrimaryPress, SecondaryPresses, useActionSlot } from './action-slot'
import { ChallengeLineField } from './challenge-line-field'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'
import { useTeamDeal } from './use-team-deal'

export const LobbyActions: React.FC<HostActionsProps> = ({
  challengeLine,
  innerclockTarget,
  isLive,
  onOpenRound,
  onPlayRightAway,
  send,
  slateKeys,
  view
}) => {
  const translate = useTranslate()
  const slot = useActionSlot()
  const playsAloud = view.settings.teams.kind === 'aloud'
  const isRoomEmpty = view.players.length === 0 && !playsAloud
  const hasNoGame = view.settings.game === null
  const table = useTeamDeal({ send, view })
  const dealsHere = slot !== 'all' && table.isDrawn

  // An empty table's launch seats its host and starts, which is the one press
  // somebody playing alone needs — the seat form and a greyed *gather round*
  // were three. The moment a player arrives it is the group's launch again.
  // The room's own screen is nobody's seat until the host says so in its
  // drawer, so its launch stays the group's.
  if (
    slot === 'all' &&
    !playsAloud &&
    launchesWithHostSeated({
      game: view.settings.game?.kind ?? null,
      mode: view.settings.mode.kind,
      seated: view.players.length
    })
  ) {
    return (
      <PlayRightAway
        className='launch'
        isDisabled={!isLive}
        onPlay={(nickname) => {
          onOpenRound()
          onPlayRightAway(nickname)
        }}
      />
    )
  }

  const fields = (
    <>
      {innerclockTarget !== null && (
        <InnerclockTargetField
          isDisabled={!isLive}
          onChange={innerclockTarget.onChange}
          seconds={innerclockTarget.seconds}
        />
      )}
      {challengeLine !== null && (
        <ChallengeLineField
          isDisabled={!isLive}
          onChange={challengeLine.onChange}
          value={challengeLine.text}
        />
      )}
    </>
  )

  // The room's own screen deals the teams from its foot, where the launch
  // will be: a table that has not been dealt has one thing to do first.
  if (dealsHere && !table.hasDealt) {
    return (
      <div className='launch'>
        <SecondaryPresses>{fields}</SecondaryPresses>
        <PrimaryPress>
          <Button
            isDisabled={!isLive || isRoomEmpty || table.isShortOfPlayers}
            onPress={table.deal}
            size='large'
          >
            {translate('team.draw')}
          </Button>
          {isRoomEmpty ? (
            <p className='reason'>{translate('host.needsPlayer')}</p>
          ) : (
            table.isShortOfPlayers && (
              <p className='reason'>
                {translate('team.drawNeeds', {
                  count: teamCountOf(view.settings.teams)
                })}
              </p>
            )
          )}
        </PrimaryPress>
      </div>
    )
  }

  const redraw = (
    <Button
      className='redraw'
      isDisabled={!isLive || table.isShortOfPlayers}
      onPress={table.deal}
      size='large'
      variant='outlined'
    >
      {translate('team.redraw')}
    </Button>
  )

  return (
    <div className='launch'>
      <SecondaryPresses>
        {fields}
        {dealsHere && redraw}
      </SecondaryPresses>
      <PrimaryPress>
        <div className='launch-presses'>
          {dealsHere && redraw}
          <Button
            isDisabled={!isLive || isRoomEmpty || hasNoGame}
            onPress={() => {
              onOpenRound()
              send({
                challengeText: challengeLine?.text,
                innerclockTargetSeconds: targetToSend(innerclockTarget),
                slateKeys,
                type: 'host.startRound'
              })
            }}
            size='large'
          >
            {translate('host.startGame')}
          </Button>
        </div>
        {/*
        The game first when both are missing: it is the decision on the stage
        the host is already looking at, where the roster fills itself as
        players arrive. The server refuses either way — see `no_game_chosen`.
      */}
        {hasNoGame ? (
          <p className='reason'>{translate('host.needsGame')}</p>
        ) : (
          isRoomEmpty && (
            <p className='reason'>{translate('host.needsPlayer')}</p>
          )
        )}
      </PrimaryPress>
    </div>
  )
}
