import type React from 'react'

import { replayedSettings } from '@melee/core/room/host-preferences'

import { Button } from '@/presentation/components/button'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { challengePickFor } from './challenge-line'
import { ChallengeLinePicker } from './challenge-line-picker'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'

export const FinishedActions: React.FC<HostActionsProps> = ({
  challengeLine,
  innerclockTarget,
  isLive,
  onOpenRound,
  onSettingsChange,
  preferences,
  send,
  slateKeys,
  view
}) => {
  const translate = useTranslate()
  const { locale } = useI18n()

  // The room rewinds an evening onto the mode each entry opens on, and the
  // settings frame right behind lays this host's own word on that game over
  // it — the frame a draw sends between two rounds of the evening.
  const replay = () => {
    send({ type: 'host.playAgain' })

    if (view.settings.lineUp.length > 1) {
      onSettingsChange(
        replayedSettings({ locale, preferences, settings: view.settings })
      )
    }
  }

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
          replay()
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
      <Button isDisabled={!isLive} onPress={replay} variant='outlined'>
        {translate('host.backToRoom')}
      </Button>
    </>
  )
}
