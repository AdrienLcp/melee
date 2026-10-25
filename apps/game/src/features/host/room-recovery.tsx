import type React from 'react'
import { useState } from 'react'

import type { RoomCode } from '@melee/protocol/identifiers'

import { readHostToken } from '@/infrastructure/storage/session-storage'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './room-recovery.sass'

/**
 * The room's own secret, on the one screen that holds it. Hidden until it is
 * asked for: this tab is often open on a console that is a television, and a
 * code the room can read over the host's shoulder is a room the room can take.
 */
export const RoomRecovery: React.FC<{ roomCode: RoomCode }> = ({
  roomCode
}) => {
  const [isRevealed, setIsRevealed] = useState(false)
  const translate = useTranslate()
  const hostToken = readHostToken(roomCode)

  // A console that took the room over on the grace window alone runs it without
  // ever learning the token, and has nothing here to show.
  if (hostToken === null) {
    return null
  }

  return (
    <div className='way room-recovery'>
      {isRevealed ? (
        <>
          <p className='token'>{hostToken}</p>
          <p className='hint'>{translate('host.recovery.hint')}</p>
        </>
      ) : (
        <Button
          onPress={() => {
            setIsRevealed(true)
          }}
          size='small'
          variant='outlined'
        >
          {translate('host.recovery.reveal')}
        </Button>
      )}
    </div>
  )
}
