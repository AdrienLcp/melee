import { useEffect, useRef } from 'react'

import type { LeanAnswer } from '@melee/protocol/client-message'

/**
 * How often an answer being built on screen saves where it stands. A trailing
 * throttle rather than a debounce: a picker dragged without a pause until the
 * clock runs out would never settle long enough for a debounce to send.
 */
const LEAN_INTERVAL_MS = 300

/**
 * Saves what the seat's screen holds and has not sent — see `player.lean` —
 * at most once every `LEAN_INTERVAL_MS`, the latest state winning, `null`
 * taking it back. `cancel`
 * drops whatever is waiting, for the press that sends the answer itself.
 */
export const useLean = (
  onLean: ((answer: LeanAnswer | null) => boolean) | null
): {
  cancel: () => void
  lean: (answer: LeanAnswer | null) => void
} => {
  const waiting = useRef<{ answer: LeanAnswer | null } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = () => {
    waiting.current = null

    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
      }
    },
    []
  )

  const lean = (answer: LeanAnswer | null) => {
    if (onLean === null) {
      return
    }

    waiting.current = { answer }

    if (timer.current !== null) {
      return
    }

    timer.current = setTimeout(() => {
      timer.current = null

      if (waiting.current !== null) {
        onLean(waiting.current.answer)
        waiting.current = null
      }
    }, LEAN_INTERVAL_MS)
  }

  return { cancel, lean }
}
