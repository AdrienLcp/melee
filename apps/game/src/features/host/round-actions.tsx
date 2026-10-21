import type React from 'react'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { PrimaryPress, SecondaryPresses, useActionSlot } from './action-slot'
import type { HostActionsProps } from './host-actions'

type RoundActionsProps = Omit<HostActionsProps, 'onOpenRound'>

export const RoundActions: React.FC<RoundActionsProps> = ({
  isLive,
  send,
  view
}) => {
  const translate = useTranslate()
  const slot = useActionSlot()

  // A blind test round ends when its clip does, so a lockout expires on its
  // own. A charade has no such clock: once the quickest players have all
  // missed, only the host can give the round back to the room.
  const isFieldClosed =
    view.round?.content.kind === 'buzzer' &&
    view.round.lockedOutPlayerIds.length > 0

  return (
    <>
      {isFieldClosed && (
        <SecondaryPresses>
          <Button
            isDisabled={!isLive}
            onPress={() => {
              if (view.round !== null) {
                send({ roundId: view.round.id, type: 'host.clearLockouts' })
              }
            }}
            variant='outlined'
          >
            {translate('buzzer.clearLockouts')}
          </Button>
        </SecondaryPresses>
      )}
      {/*
        Quiet on the console, where the round on its stage is what the host is
        reading; the room's own screen has nothing else bottom right.
      */}
      <PrimaryPress>
        <Button
          isDisabled={!isLive}
          onPress={() => {
            if (view.round !== null) {
              send({ roundId: view.round.id, type: 'host.reveal' })
            }
          }}
          size={slot === 'primary' ? 'large' : undefined}
          variant={slot === 'primary' ? 'filled' : 'underlined'}
        >
          {translate('host.reveal')}
        </Button>
      </PrimaryPress>
    </>
  )
}
