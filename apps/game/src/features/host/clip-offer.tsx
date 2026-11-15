import { useEffect, useRef } from 'react'

import type { HostRoomView } from '@melee/protocol/room'
import type { ClipFault, SilentClip } from '@melee/protocol/sound'

import {
  type ClipRefusal,
  isClipUnheard
} from '@melee/core/blindtest/clip-audio'

import { blindtestHostContent } from '@/helpers/round-content'
import {
  type Notice,
  showPassingNotice,
  useStandingNotice
} from '@/presentation/components/notices'
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

type ClipNoticeOf = {
  /** Whether a press has blessed an audio element on this screen. */
  canPlay: boolean
  /** What is said, or `null` to say nothing. */
  offer: ClipOfferState | null
  onUnlockAudio: () => void
  /** Why the last press did not arm this screen, and `null` while none has failed. */
  refusal: ClipRefusal | null
}

/**
 * Says a `ClipOfferState` as a notice standing over the page until the clip
 * plays — a fault laid at the foot of a panel was read by nobody across a
 * room — with the press that arms the screen when one is owed, and a passing
 * word once that press has made the music sound.
 */
export const useClipNotice = ({
  canPlay,
  offer,
  onUnlockAudio,
  refusal
}: ClipNoticeOf): void => {
  const translate = useTranslate()
  const wasSilentRef = useRef(false)

  const noticeOf = (shown: ClipOfferState): Notice => {
    switch (shown.kind) {
      case 'onWall':
        return {
          action: null,
          description: null,
          title: translate(`blindtest.audio.onWall.${shown.cause}`),
          tone: 'fault'
        }
      case 'fault':
        return {
          action: null,
          description: null,
          title: translate(`blindtest.audio.fault.${shown.fault}`),
          tone: 'fault'
        }
      case 'silent':
        return {
          action: {
            label: translate('blindtest.audio.start'),
            onPress: onUnlockAudio
          },
          description:
            refusal === null ? null : translate(clipRefusalKey(refusal)),
          title: translate('blindtest.audio.silent'),
          tone: 'fault'
        }
      default:
        return shown satisfies never
    }
  }

  useStandingNotice(offer === null ? null : noticeOf(offer))

  useEffect(() => {
    if (wasSilentRef.current && offer === null && canPlay) {
      showPassingNotice({
        action: null,
        description: null,
        title: translate('blindtest.audio.playing'),
        tone: 'news'
      })
    }

    wasSilentRef.current = offer?.kind === 'silent'
  })
}
