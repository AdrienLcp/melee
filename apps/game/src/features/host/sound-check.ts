import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { SoundCheckOutcome, SoundCheckReport } from '@melee/protocol/sound'

import { type ApiError, fetchSoundCheck } from '@/infrastructure/api/melee-api'
import {
  dismissNotice,
  showPassingNotice
} from '@/presentation/components/notices'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { armSoundCheck, SOUND_CHECK_MS, type SoundCheck } from './round-audio'

const HERE_KEYS = {
  blocked: 'notice.soundCheck.blocked',
  heard: 'notice.soundCheck.heard',
  stalled: 'notice.soundCheck.stalled',
  unreachable: 'notice.soundCheck.unreachable'
} as const satisfies Record<SoundCheckOutcome, PlainTranslationKey>

const ON_WALL_KEYS = {
  blocked: 'notice.soundCheck.onWall.blocked',
  heard: 'notice.soundCheck.onWall.heard',
  stalled: 'notice.soundCheck.onWall.stalled',
  unreachable: 'notice.soundCheck.onWall.unreachable'
} as const satisfies Record<SoundCheckOutcome, PlainTranslationKey>

const FETCH_FAILURE_KEYS = {
  rate_limited: 'notice.soundCheck.tooMany',
  rejected: 'notice.soundCheck.catalogue',
  unexpected_response: 'notice.soundCheck.catalogue',
  unreachable: 'error.api.unreachable'
} as const satisfies Record<ApiError, PlainTranslationKey>

/**
 * Says how a sound check went on the screen that played it. A refusal carries
 * the press that plays it again — the gesture it lacked — and leaves as that
 * press is taken, since what it says is no longer so.
 */
export const saySoundCheck = ({
  onRetry,
  outcome
}: {
  onRetry: () => void
  outcome: SoundCheckOutcome
}): void => {
  const key = showPassingNotice({
    action:
      outcome === 'blocked'
        ? {
            label: 'notice.soundCheck.start',
            onPress: () => {
              dismissNotice(key)
              onRetry()
            }
          }
        : null,
    description: null,
    title: HERE_KEYS[outcome],
    tone: outcome === 'heard' ? 'news' : 'fault'
  })
}

const sayFetchFailure = (error: ApiError): void => {
  showPassingNotice({
    action: null,
    description: null,
    title: FETCH_FAILURE_KEYS[error],
    tone: 'fault'
  })
}

/** The console's press, while the room sits in the lobby. */
export type SoundCheckPress = {
  /** A sample is on its way or sounding, so the press stops it. */
  isTesting: boolean
  /** Starts a sample, or stops the one running; one identity for the hook's life. */
  onPress: () => void
}

type UseSoundCheck = {
  /** Whether the console sounds, or the wall that is the speaker does. */
  isSpeaker: boolean
  send: (message: ClientMessage) => void
  /** What the speaking wall last reported, from the view. */
  soundCheck: SoundCheckReport | null
  /** 0 to 1, the room volume. */
  volume: number
}

/**
 * Plays a short sample on the room's speaker and says how it went: here when
 * the console sounds, through the wall and back when a wall does. The notice
 * is the whole answer, so the press only says whether a sample is running.
 */
export const useSoundCheck = ({
  isSpeaker,
  send,
  soundCheck,
  volume
}: UseSoundCheck): SoundCheckPress => {
  const [isTesting, setIsTesting] = useState(false)
  const checkRef = useRef<SoundCheck | null>(null)
  const isAwaitingWallRef = useRef(false)
  const wallEndRef = useRef<number | undefined>(undefined)

  const endOnWallAfter = (ms: number): void => {
    window.clearTimeout(wallEndRef.current)
    wallEndRef.current = window.setTimeout(() => {
      setIsTesting(false)
    }, ms)
  }

  const testHere = async (): Promise<void> => {
    const check = armSoundCheck({
      onEnded: () => {
        if (checkRef.current === check) {
          checkRef.current = null
          setIsTesting(false)
        }
      },
      volume
    })

    checkRef.current = check
    setIsTesting(true)

    const sample = await fetchSoundCheck()

    if (checkRef.current !== check) {
      return
    }

    if (sample.status === 'failure') {
      check.stop()

      if (sample.error !== 'aborted') {
        sayFetchFailure(sample.error)
      }

      return
    }

    const outcome = await check.play(sample.data.previewUrl)

    if (outcome !== 'heard' || checkRef.current === check) {
      saySoundCheck({ onRetry: test, outcome })
    }
  }

  const testOnWall = async (): Promise<void> => {
    setIsTesting(true)

    const sample = await fetchSoundCheck()

    if (sample.status === 'failure') {
      setIsTesting(false)

      if (sample.error !== 'aborted') {
        sayFetchFailure(sample.error)
      }

      return
    }

    isAwaitingWallRef.current = true
    send({ type: 'host.testSound', url: sample.data.previewUrl })
    endOnWallAfter(SOUND_CHECK_MS * 3)
  }

  // Synchronous up to `armSoundCheck`, which blesses its element in the press.
  const test = (): void => {
    void (isSpeaker ? testHere() : testOnWall())
  }

  const stop = (): void => {
    if (checkRef.current !== null) {
      checkRef.current.stop()
    } else {
      isAwaitingWallRef.current = false
      window.clearTimeout(wallEndRef.current)
      send({ type: 'host.stopSoundTest' })
      setIsTesting(false)
    }
  }

  const sayWallReport = useEffectEvent((): void => {
    if (soundCheck === null || !isAwaitingWallRef.current) {
      return
    }

    showPassingNotice({
      action: null,
      description: null,
      title: ON_WALL_KEYS[soundCheck.outcome],
      tone: soundCheck.outcome === 'heard' ? 'news' : 'fault'
    })
    endOnWallAfter(soundCheck.outcome === 'heard' ? SOUND_CHECK_MS : 0)
  })

  // A wall refused and then pressed reports the same check twice, and each
  // outcome is news; the same outcome on two checks is two checks.
  const report =
    soundCheck === null ? null : `${soundCheck.checkId} ${soundCheck.outcome}`

  useEffect(() => {
    if (report !== null) {
      sayWallReport()
    }
  }, [report])

  useEffect(
    () => () => {
      checkRef.current?.stop()
      window.clearTimeout(wallEndRef.current)
    },
    []
  )

  const pressRef = useRef(test)

  useEffect(() => {
    pressRef.current = isTesting ? stop : test
  })

  // Stable, because it travels to the menu through the room actions, whose
  // report re-runs on every new identity.
  const onPress = useCallback(() => {
    pressRef.current()
  }, [])

  return { isTesting, onPress }
}
