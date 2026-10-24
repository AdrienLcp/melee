import type React from 'react'

import { launchesWithHostSeated } from '@melee/core/room/play-right-away'

import { Button } from '@/presentation/components/button'
import { PlayRightAway } from '@/presentation/components/play-right-away'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ChallengeLineField } from './challenge-line-field'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'

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
  const playsAloud = view.settings.teams.kind === 'aloud'
  const isRoomEmpty = view.players.length === 0 && !playsAloud
  const hasNoGame = view.settings.game === null

  // An empty table's launch seats its host and starts, which is the one press
  // somebody playing alone needs — the seat form and a greyed *gather round*
  // The moment a player arrives it is the group's launch again.
  if (
    !playsAloud &&
    launchesWithHostSeated({
      seated: view.players.length,
      settings: view.settings
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

  return (
    <div className='launch'>
      {fields}
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
      {/*
        The game first when both are missing: it is the decision the panel
        opens on, where the roster fills itself as players arrive. The server
        refuses either way — see `no_game_chosen`.
      */}
      {hasNoGame ? (
        <p className='reason'>{translate('host.needsGame')}</p>
      ) : (
        isRoomEmpty && <p className='reason'>{translate('host.needsPlayer')}</p>
      )}
    </div>
  )
}
