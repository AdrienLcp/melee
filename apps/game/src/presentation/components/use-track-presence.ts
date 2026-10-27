import type React from 'react'
import { useEffect, useState } from 'react'

import type { BoardSettings } from '@melee/protocol/board'

import type { TrackPawn } from '@melee/core/board/track-pawns'

/**
 * - `entering` — the host has just turned the board on, and the cases are
 *   coming in from the edges;
 * - `standing` — on the screen, still;
 * - `leaving` — the host has just turned it off, and the cases are going back
 *   out, drawn at the length they had.
 */
export type TrackPresence = 'entering' | 'leaving' | 'standing'

export type PresentTrack = {
  length: number
  /** The pawns to draw: the last ones the board carried while it leaves. */
  pawns: readonly TrackPawn[]
  presence: TrackPresence
}

type DrawnTrack = { length: number; presence: TrackPresence }

const keyOf = ({
  board,
  pawns
}: {
  board: BoardSettings
  pawns: readonly TrackPawn[]
}): string =>
  [
    board.kind === 'track' ? board.length : 'off',
    ...pawns.map((pawn) => `${pawn.id}:${pawn.board.case}:${pawn.board.move}`)
  ].join(',')

const nextTrack = ({
  board,
  current
}: {
  board: BoardSettings
  current: DrawnTrack | null
}): DrawnTrack | null => {
  if (board.kind === 'off') {
    return current === null ? null : { ...current, presence: 'leaving' }
  }

  return current === null || current.presence === 'leaving'
    ? { length: board.length, presence: 'entering' }
    : { ...current, length: board.length }
}

/**
 * Whether the track is drawn, and how it is moving. A track already on when
 * the screen arrives stands at once, so a reload draws the board in place;
 * only a switch the screen sees plays. Each move settles once every animation
 * under `trackRef` has finished, which the reduced-motion sheet makes at once.
 */
export const useTrackPresence = ({
  board,
  isDrawn,
  pawns,
  trackRef
}: {
  board: BoardSettings
  /** Whether the cases are on the screen, which they are not before the track is measured. */
  isDrawn: boolean
  pawns: readonly TrackPawn[]
  trackRef: React.RefObject<HTMLDivElement | null>
}): PresentTrack | null => {
  const [track, setTrack] = useState<DrawnTrack | null>(() =>
    board.kind === 'track'
      ? { length: board.length, presence: 'standing' }
      : null
  )
  const [keptPawns, setKeptPawns] = useState(pawns)
  const [seenKey, setSeenKey] = useState(() => keyOf({ board, pawns }))
  const key = keyOf({ board, pawns })

  if (key !== seenKey) {
    setSeenKey(key)
    setTrack((current) => nextTrack({ board, current }))

    if (board.kind === 'track') {
      setKeptPawns(pawns)
    }
  }

  const presence = track?.presence ?? null

  useEffect(() => {
    const element = trackRef.current

    const isWaitingForCases = presence === 'entering' && !isDrawn

    if (
      presence === null ||
      presence === 'standing' ||
      element === null ||
      isWaitingForCases
    ) {
      return
    }

    let isCancelled = false

    // Settled rather than all: a case re-laid mid-move cancels its animation,
    // and a move that never settled would leave the board on the screen.
    void Promise.allSettled(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished)
    ).then(() => {
      if (isCancelled) {
        return
      }

      setTrack((current) => {
        if (current?.presence !== presence) {
          return current
        }

        return presence === 'leaving'
          ? null
          : { ...current, presence: 'standing' }
      })
    })

    return () => {
      isCancelled = true
    }
  }, [isDrawn, presence, trackRef])

  if (track === null) {
    return null
  }

  return {
    ...track,
    pawns: track.presence === 'leaving' ? keptPawns : pawns
  }
}
