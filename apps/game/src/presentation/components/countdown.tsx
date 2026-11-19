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
  const seconds = useSecondsLeft(clock, target)
  const { leaving, onLeft } = useLeavingSecond(seconds)

  return (
    <p aria-live='polite' className={classNames('countdown', className)}>
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
 * The second still to strike, held at 1 past zero: the token stays on until
 * the round's snapshot lands, and the screen's own exit carries it off over
 * the round (`useRoomView`). A token lifted before zero left that exit an
 * empty screen to carry, blank for as long as the snapshot took to arrive.
 */
const secondsAt = (remainingMs: number): number =>
  Math.max(1, Math.ceil(remainingMs / 1000))

const useSecondsLeft = (
  clock: ClockEstimate | null,
  target: number
): number => {
  const [seconds, setSeconds] = useState(() =>
    secondsAt(millisecondsUntil(clock, target, nowMs()))
  )

  useEffect(() => {
    let frame = 0

    const tick = (): void => {
      setSeconds(secondsAt(millisecondsUntil(clock, target, nowMs())))
      frame = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [clock, target])

  return seconds
}
