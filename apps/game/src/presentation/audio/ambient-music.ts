import { useEffect, useState } from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { ambientMoodOf } from '@melee/core/room/ambient-music'

import type { AmbientPlayer } from './ambient/ambient-player'
import { onCuesRunning, unlockCues } from './cue-audio'

/**
 * The soundtrack's share of the room volume: under the clip, which plays at
 * the whole of it, so music never competes with a track being named.
 */
export const MUSIC_SHARE = 0.35

/** Long enough for the bus to fade out before the player is let go. */
const LET_GO_AFTER_MS = 2_500

/**
 * The room's soundtrack, on the screen the room listens to — `view` is `null`
 * on every other, for the reason the clip and the cues are the speaker's
 * alone. It waits for the cue context to run, which any press on the page
 * grants, so a reloaded speaker picks it up on the first touch.
 */
export const useAmbientMusic = ({
  isTestingSound,
  view,
  volume
}: {
  isTestingSound: boolean
  view: HostRoomView | null
  /** The level the room's speaker plays at. */
  volume: number
}): void => {
  const [player, setPlayer] = useState<AmbientPlayer | null>(null)
  const isWanted = view?.settings.playsMusic === true
  const mood =
    view === null
      ? null
      : ambientMoodOf({
          isPaused: view.isPaused,
          isTestingSound,
          phase: view.phase,
          playsMusic: view.settings.playsMusic,
          roundKind: view.round?.content.kind ?? null
        })

  useEffect(() => {
    if (!isWanted) {
      return
    }

    document.addEventListener('pointerup', unlockCues)
    document.addEventListener('keydown', unlockCues)

    return () => {
      document.removeEventListener('pointerup', unlockCues)
      document.removeEventListener('keydown', unlockCues)
    }
  }, [isWanted])

  useEffect(() => {
    if (!isWanted) {
      return
    }

    let started: AmbientPlayer | null = null
    let isCancelled = false
    let isLoading = false

    const unsubscribe = onCuesRunning((context) => {
      if (isLoading) {
        return
      }

      isLoading = true
      void import('./ambient/soundtrack').then(({ startSoundtrack }) => {
        if (!isCancelled) {
          started = startSoundtrack(context)
          setPlayer(started)
        }
      })
    })

    return () => {
      isCancelled = true
      unsubscribe()

      const leaving = started

      if (leaving !== null) {
        leaving.setMood(null)
        setTimeout(leaving.dispose, LET_GO_AFTER_MS)
        setPlayer(null)
      }
    }
  }, [isWanted])

  useEffect(() => {
    player?.setLevel(volume * MUSIC_SHARE)
  }, [player, volume])

  useEffect(() => {
    player?.setMood(mood)
  }, [mood, player])
}
