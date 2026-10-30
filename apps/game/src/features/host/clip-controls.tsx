import type React from 'react'

import type { ClipAction } from '@melee/protocol/client-message'

import { blindtestHostContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import {
  PauseIcon,
  PlayIcon,
  ReplayIcon
} from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { HostActionsProps } from './host-actions'

type ClipControlsProps = Pick<HostActionsProps, 'isLive' | 'send' | 'view'>

/**
 * The host's hand on the clip under a blind test's reveal, wherever it plays —
 * the wall's speaker as much as this screen's — so the table can argue over it.
 */
export const ClipControls: React.FC<ClipControlsProps> = ({
  isLive,
  send,
  view
}) => {
  const translate = useTranslate()
  const blindtest = blindtestHostContent(view)
  const roundId = view.round?.id ?? null

  if (blindtest?.audioUrl == null || roundId === null) {
    return null
  }

  const steer = (action: ClipAction) => {
    send({ action, roundId, type: 'host.controlClip' })
  }

  const { isPaused } = blindtest.playback

  return (
    <div className='clip-controls'>
      <Button
        icon={isPaused ? <PlayIcon /> : <PauseIcon />}
        isDisabled={!isLive}
        onPress={() => steer(isPaused ? 'resume' : 'pause')}
        variant='outlined'
      >
        {translate(
          isPaused ? 'blindtest.audio.resume' : 'blindtest.audio.pause'
        )}
      </Button>
      <Button
        icon={<ReplayIcon />}
        isDisabled={!isLive}
        onPress={() => steer('restart')}
        variant='outlined'
      >
        {translate('blindtest.audio.replay')}
      </Button>
    </div>
  )
}
