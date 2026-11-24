import type React from 'react'

import { MAX_PLAYERS_PER_ROOM } from '@melee/protocol/room'

import { launchesWithHostSeated } from '@melee/core/room/play-right-away'

import { Button } from '@/presentation/components/button'
import { PlayRightAway } from '@/presentation/components/play-right-away'
import { useLastShown } from '@/presentation/components/use-last-shown'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { challengePickFor } from './challenge-line'
import { ChallengeLinePicker } from './challenge-line-picker'
import { ConsoleReady } from './console-ready'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'
import { SeatOffer } from './seat-offer'

export const LobbyActions: React.FC<HostActionsProps> = ({
  challengeLine,
  innerclockTarget,
  isLive,
  onOpenRound,
  onPlayRightAway,
  onTakeSeat,
  send,
  slateKeys,
  view
}) => {
  const translate = useTranslate()
  const playsAloud = view.settings.teams.kind === 'aloud'
  const isRoomEmpty = view.players.length === 0 && !playsAloud
  const hasNoGame = view.settings.game === null
  // The game first when both are missing: it is the decision the panel opens
  // on, where the roster fills itself as players arrive. The server refuses
  // either way — see `no_game_chosen`.
  const reason = hasNoGame
    ? ('host.needsGame' as const)
    : isRoomEmpty
      ? ('host.needsPlayer' as const)
      : null
  const shownReason = useLastShown(reason)

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
        <ChallengeLinePicker isDisabled={!isLive} line={challengeLine} />
      )}
    </>
  )

  return (
    <div className='launch'>
      {fields}
      <div className='console-ready-group'>
        <ConsoleReady isDisabled={!isLive} send={send} view={view} />
        <Button
          isDisabled={!isLive || isRoomEmpty || hasNoGame}
          onPress={() => {
            onOpenRound()
            send({
              ...challengePickFor(challengeLine),
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
      <SeatOffer
        game={view.settings.game?.kind ?? null}
        isDisabled={!isLive}
        isOpen={
          view.youId === null && view.players.length < MAX_PLAYERS_PER_ROOM
        }
        onTakeSeat={onTakeSeat}
      />
      <div
        className='reason-fold'
        data-open={reason !== null || undefined}
        inert={reason === null}
      >
        <p className='reason'>
          {shownReason === null ? null : translate(shownReason)}
        </p>
      </div>
    </div>
  )
}
