import type React from 'react'

import type { HostRoomView } from '@melee/protocol/room'
import type { ClipFault } from '@melee/protocol/sound'

import {
  type ClipRefusal,
  isClipUnheard
} from '@melee/core/blindtest/clip-audio'

import { blindtestHostContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { clipRefusalKey } from '@/presentation/i18n/translation'

type ClipOfferProps = {
  /** Whether a press has blessed an audio element on this screen. */
  canPlay: boolean
  /** Why the round's clip is not sounding here, while this screen is the speaker. */
  fault: ClipFault | null
  /** This screen plays the clip, which is the only one that owes the offer. */
  isSpeaker: boolean
  onUnlockAudio: () => void
  /** Why the last press did not arm this screen, and `null` while none has failed. */
  refusal: ClipRefusal | null
  view: HostRoomView
}

/**
 * A silent round is *visually identical* to one that plays — the clip's
 * progress comes from the server, buzzes work, the reveal lands — so this is
 * the one thing that has to be said out loud: on the speaker, the press it
 * owes or the file it could not play; on a console that is not the speaker,
 * what the room's screen reported. Nothing at all while the clip is heard, or
 * while there is none.
 */
export const ClipOffer: React.FC<ClipOfferProps> = ({
  canPlay,
  fault,
  isSpeaker,
  onUnlockAudio,
  refusal,
  view
}) => {
  const translate = useTranslate()
  const isClipOnScreen =
    blindtestHostContent(view)?.audioUrl != null &&
    view.phase !== 'lobby' &&
    view.phase !== 'finished'

  // The speaker is the room's screen, which the host is not looking at: what
  // it reported is said here, where somebody can do something about it.
  if (!isSpeaker) {
    const reported = view.silentClip

    if (
      !isClipOnScreen ||
      reported === null ||
      reported.roundId !== view.round?.id
    ) {
      return null
    }

    return (
      <div className='muted-clip'>
        <p className='refusal' role='alert'>
          {translate(`blindtest.audio.onWall.${reported.cause}`)}
        </p>
      </div>
    )
  }

  if (
    isClipUnheard({
      canPlay,
      hasClip: blindtestHostContent(view)?.audioUrl != null,
      phase: view.phase
    })
  ) {
    return (
      <div className='muted-clip'>
        <p>{translate('blindtest.audio.silent')}</p>
        <Button onPress={onUnlockAudio} size='small' variant='outlined'>
          {translate('blindtest.audio.start')}
        </Button>
        {/* Below the offer, because it is what the last one came back with. */}
        {refusal !== null && (
          <p className='refusal' role='alert'>
            {translate(clipRefusalKey(refusal))}
          </p>
        )}
      </div>
    )
  }

  if (!isClipOnScreen || fault === null || fault === 'blocked') {
    return null
  }

  return (
    <div className='muted-clip'>
      <p className='refusal' role='alert'>
        {translate(`blindtest.audio.fault.${fault}`)}
      </p>
    </div>
  )
}
