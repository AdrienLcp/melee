import type React from 'react'
import { useState } from 'react'

type LeavingValue<Value> = {
  /** The value shown now, or the one it last showed while its exit plays; `null` once nothing is left to draw. */
  drawn: Value | null
  /** Whether `drawn` is the last value, playing its exit. */
  isLeaving: boolean
  /** Ends the exit on the animation `isExitEnd` accepts; `undefined` unless leaving. */
  onAnimationEnd: React.AnimationEventHandler | undefined
}

const isOwnAnimation = (event: React.AnimationEvent): boolean =>
  event.target === event.currentTarget

/**
 * Keeps a value that just went to `null` drawn until its exit animation ends,
 * since what ended it no longer holds it. Spread `onAnimationEnd` on the
 * element that plays the exit, and `data-leaving` from `isLeaving`.
 *
 * The handler exists only while leaving: a no-op set at another moment — the
 * entry's own end — stays queued and erases the leaving a render derives
 * (`react-components.md`). Pass a value whose identity holds from one render
 * to the next.
 */
export const useLeavingValue = <Value>(
  value: Value | null,
  {
    isExitEnd = isOwnAnimation
  }: {
    /** Which `animationend` closes the exit; by default one the element plays itself. */
    isExitEnd?: (event: React.AnimationEvent) => boolean
  } = {}
): LeavingValue<Value> => {
  const [held, setHeld] = useState(value)
  const [leaving, setLeaving] = useState<Value | null>(null)

  if (value !== held) {
    setLeaving(value === null ? held : null)
    setHeld(value)
  }

  return {
    drawn: value ?? leaving,
    isLeaving: leaving !== null,
    onAnimationEnd:
      leaving === null
        ? undefined
        : (event) => {
            if (isExitEnd(event)) {
              setLeaving(null)
            }
          }
  }
}
