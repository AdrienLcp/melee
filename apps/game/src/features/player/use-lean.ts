import { useEffect, useEffectEvent, useRef } from 'react'

import type { LeanAnswer } from '@melee/protocol/client-message'

import { leanDelayMs } from '@/helpers/lean-delay'
import { nowMs } from '@/infrastructure/clock'
import { useSocketOpenings } from '@/presentation/connection/connection-provider'

import { createLeanSender, type LeanSender } from './lean-sender'

/**
 * Saves what the seat's screen holds and has not sent — see `player.lean` —
 * on a trailing throttle, the latest state winning, `null` taking it back.
 * The throttle gives way as the round's clock runs out (`leanDelayMs`), so
 * the last change before it lands rather than waiting past the close. A lean
 * the socket could not write stays owed, and every socket that reopens is
 * sent the last one again (`createLeanSender`). `cancel` drops whatever is
 * waiting, for the press that sends the answer itself.
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
  const sender = useRef<LeanSender | null>(null)
  const closesAt = useRef<number | null>(null)
  const openings = useSocketOpenings()
  const seenOpenings = useRef(openings)
  const write = useEffectEvent(
    (answer: LeanAnswer | null) => onLean?.(answer) ?? false
  )

  useEffect(() => {
    closesAt.current = closesInMs === null ? null : nowMs() + closesInMs
  }, [closesInMs])

  useEffect(() => {
    const created = createLeanSender((answer) => write(answer))

    sender.current = created

    return () => {
      created.dispose()
      sender.current = null
    }
  }, [])

  useEffect(() => {
    if (openings !== seenOpenings.current) {
      seenOpenings.current = openings
      sender.current?.resend()
    }
  }, [openings])

  const cancel = () => {
    sender.current?.cancel()
  }

  const lean = (answer: LeanAnswer | null) => {
    if (onLean === null) {
      return
    }

    sender.current?.lean(
      answer,
      leanDelayMs(closesAt.current === null ? null : closesAt.current - nowMs())
    )
  }

  return { cancel, lean }
}
