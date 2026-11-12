import { useEffect, useRef } from 'react'

import type { LeanAnswer } from '@melee/protocol/client-message'

import { leanDelayMs } from '@/helpers/lean-delay'
import { nowMs } from '@/infrastructure/clock'

/**
 * Saves what the seat's screen holds and has not sent — see `player.lean` —
 * on a trailing throttle, the latest state winning, `null` taking it back.
 * The throttle gives way as the round's clock runs out (`leanDelayMs`), so
 * the last change before it lands rather than waiting past the close.
 * `cancel` drops whatever is waiting, for the press that sends the answer
 * itself.
 */
export const useLean = ({
  closesInMs,
  onLean
}: {
  /** What is left of the round's clock on the last snapshot, `null` while nothing counts down. */
  closesInMs: number | null
  onLean: ((answer: LeanAnswer | null) => boolean) | null
}): {
  cancel: () => void
  lean: (answer: LeanAnswer | null) => void
} => {
  const waiting = useRef<{ answer: LeanAnswer | null } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closesAt = useRef<number | null>(null)

  useEffect(() => {
    closesAt.current = closesInMs === null ? null : nowMs() + closesInMs
  }, [closesInMs])

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

    timer.current = setTimeout(
      () => {
        timer.current = null

        if (waiting.current !== null) {
          onLean(waiting.current.answer)
          waiting.current = null
        }
      },
      leanDelayMs(closesAt.current === null ? null : closesAt.current - nowMs())
    )
  }

  return { cancel, lean }
}
