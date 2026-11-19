import { useEffect, useState } from 'react'

import {
  type ClockEstimate,
  millisecondsUntil,
  serverNow
} from '@melee/core/time/clock-sync'

import { nowMs } from '@/infrastructure/clock'

/**
 * Where this screen stands against the round's window:
 * - `before` — the board is waiting to light;
 * - `open` — lit, `elapsedMs` into the window when it was last read, which
 *   the groove starts its drain from;
 * - `closed` — the window is over, whatever is still in the air.
 */
export type LightsWindowState =
  | { phase: 'before' }
  | { elapsedMs: number; phase: 'open'; windowMs: number }
  | { phase: 'closed' }

/**
 * The board lights and darkens on this device's estimate of the server
 * clock, never on a frame landing: an error in the estimate shifts both ends
 * by the same amount, so every seat plays the same length of window.
 * Scheduled on animation frames, so each edge lands on a paint.
 */
export const useLightsWindow = ({
  clock,
  closesAt,
  opensAt
}: {
  clock: ClockEstimate | null
  closesAt: number | null
  opensAt: number | null
}): LightsWindowState => {
  const [state, setState] = useState<LightsWindowState>({ phase: 'before' })

  useEffect(() => {
    if (opensAt === null || closesAt === null) {
      setState({ phase: 'before' })

      return
    }

    let frame = 0
    let shown: LightsWindowState['phase'] | null = null

    const tick = (): void => {
      const now = nowMs()

      if (millisecondsUntil(clock, closesAt, now) === 0) {
        setState({ phase: 'closed' })

        return
      }

      const isOpen = millisecondsUntil(clock, opensAt, now) === 0

      if (isOpen && shown !== 'open') {
        shown = 'open'
        setState({
          elapsedMs: serverNow(clock, now) - opensAt,
          phase: 'open',
          windowMs: closesAt - opensAt
        })
      } else if (!isOpen && shown !== 'before') {
        shown = 'before'
        setState({ phase: 'before' })
      }

      frame = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [clock, closesAt, opensAt])

  return state
}

/** How far into the window the groove stands: full before it opens, empty once it closes. */
export const lightsElapsedMsOf = ({
  state,
  windowMs
}: {
  state: LightsWindowState
  windowMs: number
}): number => {
  switch (state.phase) {
    case 'before':
      return 0
    case 'open':
      return state.elapsedMs
    case 'closed':
      return windowMs
    default:
      return state satisfies never
  }
}
