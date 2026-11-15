import { useEffect, useRef } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'

import { armSoundCheck, type SoundCheck } from '@/features/host/round-audio'
import { saySoundCheck } from '@/features/host/sound-check'
import type { WallSoundTest } from '@/infrastructure/messaging/use-wall-connection'

type PlayedSample = Extract<WallSoundTest, { type: 'wall.testSound' }>

/**
 * Plays the sample the console sent and reports how it went, said here as
 * well, since this is the screen somebody has to walk up to when the browser
 * refused it: the notice's press plays it again inside that gesture.
 */
export const useWallSoundCheck = ({
  send,
  volume
}: {
  send: (message: ClientMessage) => void
  /** 0 to 1, the room volume. */
  volume: number
}): ((frame: WallSoundTest) => void) => {
  const checkRef = useRef<SoundCheck | null>(null)

  const play = async ({ checkId, url }: PlayedSample): Promise<void> => {
    checkRef.current?.stop()

    const check = armSoundCheck({ onEnded: () => {}, volume })

    checkRef.current = check

    const outcome = await check.play(url)

    send({ checkId, outcome, type: 'speaker.reportSoundCheck' })
    saySoundCheck({
      onRetry: () => {
        void play({ checkId, type: 'wall.testSound', url })
      },
      outcome
    })
  }

  useEffect(
    () => () => {
      checkRef.current?.stop()
    },
    []
  )

  return (frame) => {
    if (frame.type === 'wall.stopSoundTest') {
      checkRef.current?.stop()
      checkRef.current = null

      return
    }

    void play(frame)
  }
}
