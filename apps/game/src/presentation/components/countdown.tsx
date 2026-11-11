import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useEffect, useState } from 'react'

import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import { nowMs } from '@/infrastructure/clock'

import './countdown.sass'

type CountdownProps = {
  /** This device's estimate of the server clock; `null` before the first pong. */
  clock: ClockEstimate | null
  className?: string
  /** Server time the countdown lands on, not a duration. */
  target: number
}

/**
 * Counts against the server's clock rather than a local timer started when the
 * message arrived — that difference is the whole point of the handshake. A
 * screen four seconds fast still hits zero with everyone else.
 */
export const Countdown: React.FC<CountdownProps> = ({
  clock,
  className,
  target
}) => {
  const { isLifting, seconds } = useCount(clock, target)
  const { leaving, onLeft } = useLeavingSecond(seconds)

  return (
    <p
      aria-live='polite'
      className={classNames('countdown', className)}
      data-lifting={isLifting || undefined}
    >
      {leaving !== null && (
        <span
          aria-hidden='true'
          className='numeral'
          data-leaving
          key={leaving}
          onAnimationEnd={onLeft}
        >
          {leaving}
        </span>
      )}
      <span className='numeral' key={seconds}>
        {seconds}
      </span>
    </p>
  )
}

/**
 * The second just struck off, kept on the token until its exit ends so the
 * next one is struck over it rather than onto an empty token.
 */
const useLeavingSecond = (
  seconds: number
): { leaving: number | null; onLeft: React.AnimationEventHandler } => {
  const [shown, setShown] = useState(seconds)
  const [leaving, setLeaving] = useState<number | null>(null)

  if (seconds !== shown) {
    setLeaving(shown)
    setShown(seconds)
  }

  return {
    leaving,
    onLeft: (event) => {
      if (event.target === event.currentTarget) {
        setLeaving(null)
      }
    }
  }
}

/**
 * The token's lift-off, `--transition-base` in `countdown.sass`, played out in
 * the count's last moment: the round's snapshot lands a few frames after zero,
 * too soon for an exit started at zero to be seen before the round replaces it.
 */
const LIFT_OFF_MS = 260

type Count = { isLifting: boolean; seconds: number }

const countAt = (remainingMs: number): Count => ({
  isLifting: remainingMs <= LIFT_OFF_MS,
  // The last second struck stays on the token as it lifts: a zero struck from
  // nothing inside a token already fading was never seen, and a round frame
  // running late would count on into `-1`.
  seconds: Math.max(1, Math.ceil(remainingMs / 1000))
})

const useCount = (clock: ClockEstimate | null, target: number): Count => {
  const [seconds, setSeconds] = useState(
    () => countAt(millisecondsUntil(clock, target, nowMs())).seconds
  )
  const [isLifting, setLifting] = useState(
    () => countAt(millisecondsUntil(clock, target, nowMs())).isLifting
  )

  useEffect(() => {
    let frame = 0

    const tick = (): void => {
      const count = countAt(millisecondsUntil(clock, target, nowMs()))

      setSeconds(count.seconds)
      setLifting(count.isLifting)
      frame = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [clock, target])

  return { isLifting, seconds }
}
