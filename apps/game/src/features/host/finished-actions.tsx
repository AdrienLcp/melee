import type React from 'react'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { PrimaryPress, SecondaryPresses } from './action-slot'
import { ChallengeLineField } from './challenge-line-field'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'
import { useSettingsSummary } from './use-settings-summary'

export const FinishedActions: React.FC<HostActionsProps> = ({
  challengeLine,
  innerclockTarget,
  draftSource,
  isLive,
  onOpenRound,
  send,
  slateKeys,
  view
}) => {
  const translate = useTranslate()
  const summary = useSettingsSummary({ draftSource, settings: view.settings })

  return (
    <>
      <SecondaryPresses>
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
      </SecondaryPresses>
      <PrimaryPress>
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
              challengeText: challengeLine?.text,
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
        What *again* means, under the button that means it. This press does not
        stop at the lobby: it sends the room straight into a countdown of the
        same game, in the same mode, for the same number of rounds — and the
        setup fold's closed summary was the only thing saying which, until
        `finished` stopped drawing a footer that could act on a game in flight.

        It is also what tells the two buttons apart: anything in this line the
        table wants changed is reached through the one below it.
      */}
        <p className='replays'>{summary}</p>
      </PrimaryPress>
      {/*
        The lobby it lands on *is* the room's front door — the game picker, the
        settings and the roster, in that order — so the label names the
        destination rather than one of the things you can do once you are there.
        Leaving for good is an exit and lives in the menu, with every other one.
      */}
      <SecondaryPresses>
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({ type: 'host.playAgain' })
          }}
          variant='outlined'
        >
          {translate('host.backToRoom')}
        </Button>
      </SecondaryPresses>
    </>
  )
}
