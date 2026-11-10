import type React from 'react'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { challengePickFor } from './challenge-line'
import { ChallengeLinePicker } from './challenge-line-picker'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'

export const FinishedActions: React.FC<HostActionsProps> = ({
  challengeLine,
  innerclockTarget,
  isLive,
  onOpenRound,
  send,
  slateKeys,
  view
}) => {
  const translate = useTranslate()

  return (
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
      <Button
        isDisabled={!isLive || view.players.length === 0}
        onPress={() => {
          onOpenRound()
          // Two frames rather than a new message: `host.playAgain` already
          // means "same seats, same settings, scores at zero", and the lobby it
          // lands in is a phase nobody needs to look at when the answer to
          // "again?" was yes.
          send({ type: 'host.playAgain' })
          send({
            ...challengePickFor(challengeLine),
            innerclockTargetSeconds: targetToSend(innerclockTarget),
            slateKeys,
            type: 'host.startRound'
          })
        }}
        size='large'
      >
        {translate('host.playAgain')}
      </Button>
      {/*
        The lobby it lands on *is* the room's front door — the game picker, the
        settings and the roster, in that order — so the label names the
        destination rather than one of the things you can do once you are there.
        Leaving for good is an exit and lives in the menu, with every other one.
      */}
      <Button
        isDisabled={!isLive}
        onPress={() => {
          send({ type: 'host.playAgain' })
        }}
        variant='outlined'
      >
        {translate('host.backToRoom')}
      </Button>
    </>
  )
}
