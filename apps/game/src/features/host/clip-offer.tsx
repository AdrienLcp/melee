import type React from 'react'

import type { HostRoomView } from '@melee/protocol/room'
import type { ClipFault, SilentClip } from '@melee/protocol/sound'

import {
  type ClipRefusal,
  isClipUnheard
} from '@melee/core/blindtest/clip-audio'

import { blindtestHostContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { RefusalNote } from '@/presentation/components/refusal-note'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { clipRefusalKey } from '@/presentation/i18n/translation'

/**
 * What this screen owes the room about the clip: `onWall`, what the room's
 * screen reported, on a console that is not the speaker; `silent`, the press
 * a speaker no press has armed owes; `fault`, the file the speaker could not
 * play.
 */
export type ClipOfferState =
  | { cause: SilentClip['cause']; kind: 'onWall' }
  | { fault: Exclude<ClipFault, 'blocked'>; kind: 'fault' }
  | { kind: 'silent' }

type ClipOfferOf = {
  /** Whether a press has blessed an audio element on this screen. */
  canPlay: boolean
  /** Why the round's clip is not sounding here, while this screen is the speaker. */
  fault: ClipFault | null
  /** This screen plays the clip, which is the only one that owes the offer. */
  isSpeaker: boolean
  view: HostRoomView | null
}

/**
 * A silent round is *visually identical* to one that plays — the clip's
 * progress comes from the server, buzzes work, the reveal lands — so this is
 * the one thing that has to be said out loud: on the speaker, the press it
 * owes or the file it could not play; on a console that is not the speaker,
 * what the room's screen reported. `null` while the clip is heard, or while
 * there is none.
 */
export const clipOfferOf = ({
  canPlay,
  fault,
  isSpeaker,
  view
}: ClipOfferOf): ClipOfferState | null => {
  if (view === null) {
    return null
  }

  const hasClip = blindtestHostContent(view)?.audioUrl != null
  const isClipOnScreen =
    hasClip && view.phase !== 'lobby' && view.phase !== 'finished'

  // The speaker is the room's screen, which the host is not looking at: what
  // it reported is said here, where somebody can do something about it.
  if (!isSpeaker) {
    const reported = view.silentClip

    return isClipOnScreen &&
      reported !== null &&
      reported.roundId === view.round?.id
      ? { cause: reported.cause, kind: 'onWall' }
      : null
  }

  if (isClipUnheard({ canPlay, hasClip, phase: view.phase })) {
    return { kind: 'silent' }
  }

  return isClipOnScreen && fault !== null && fault !== 'blocked'
    ? { fault, kind: 'fault' }
    : null
}

/** Two offers that say the same thing, whatever objects carry them. */
export const isSameClipOffer = (
  left: ClipOfferState,
  right: ClipOfferState
): boolean =>
  left.kind === right.kind &&
  (left.kind !== 'onWall' ||
    (right.kind === 'onWall' && left.cause === right.cause)) &&
  (left.kind !== 'fault' ||
    (right.kind === 'fault' && left.fault === right.fault))

type ClipOfferNoteProps = {
  /** What is said, or `null` to say nothing. */
  offer: ClipOfferState | null
  onUnlockAudio: () => void
  /** Why the last press did not arm this screen, and `null` while none has failed. */
  refusal: ClipRefusal | null
}

/** The words and the press of a `ClipOfferState`. */
export const ClipOfferNote: React.FC<ClipOfferNoteProps> = ({
  offer,
  onUnlockAudio,
  refusal
}) => {
  const translate = useTranslate()

  if (offer === null) {
    return null
  }

  switch (offer.kind) {
    case 'onWall':
      return (
        <div className='muted-clip'>
          <p className='refusal' role='alert'>
            {translate(`blindtest.audio.onWall.${offer.cause}`)}
          </p>
        </div>
      )
    case 'fault':
      return (
        <div className='muted-clip'>
          <p className='refusal' role='alert'>
            {translate(`blindtest.audio.fault.${offer.fault}`)}
          </p>
        </div>
      )
    case 'silent':
      return (
        <div className='muted-clip'>
          <p>{translate('blindtest.audio.silent')}</p>
          <Button onPress={onUnlockAudio} size='small' variant='outlined'>
            {translate('blindtest.audio.start')}
          </Button>
          {/* Below the offer, because it is what the last one came back with. */}
          <RefusalNote
            message={
              refusal === null ? null : translate(clipRefusalKey(refusal))
            }
          />
        </div>
      )
    default:
      return offer satisfies never
  }
}

type ClipOfferProps = ClipOfferOf &
  Omit<ClipOfferNoteProps, 'offer'> & { view: HostRoomView }

/** The offer this screen owes the clip right now, or nothing. */
export const ClipOffer: React.FC<ClipOfferProps> = ({
  onUnlockAudio,
  refusal,
  ...state
}) => (
  <ClipOfferNote
    offer={clipOfferOf(state)}
    onUnlockAudio={onUnlockAudio}
    refusal={refusal}
  />
)
