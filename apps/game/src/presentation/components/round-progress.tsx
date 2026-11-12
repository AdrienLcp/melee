import type React from 'react'
import { useEffect, useState } from 'react'

import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import { clockReadingOf } from '@/helpers/clock-reading'
import { nowMs } from '@/infrastructure/clock'
import { clockFigure } from '@/presentation/i18n/clock-figure'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './round-progress.sass'

type RoundProgressProps = {
  /** How long the round runs for, from the game whose round it is. */
  durationMs: number
  /**
   * Round time already consumed, buzz pauses excluded. The server's own count,
   * which is what makes this the room's clock rather than each device's.
   */
  elapsedMs: number
  /** Why the bar is counting, read before the groove. */
  label?: string
}

/**
 * How much of the round is left, as a groove draining in the phase's ink and
 * the whole seconds beside it. The groove runs on a CSS animation rather than a
 * React timer: the server has already decided when this ends, so a per-frame
 * render would only add work. The figure renders once a second, because a
 * locale writes it.
 *
 * It starts at the fraction still standing rather than at full, which is what
 * lets a screen arriving mid-round — a player back from a lock, a host who
 * reloaded — show where the room is instead of promising a whole clip.
 */
export const RoundProgress: React.FC<RoundProgressProps> = ({
  durationMs,
  elapsedMs,
  label
}) => {
  const remainingMs = Math.max(0, durationMs - elapsedMs)

  return (
    <div
      className='round-progress'
      // A running animation cannot be re-aimed: moving its duration or its
      // starting point rebases what it has already played, and the bar jumps.
      // Re-keying restarts it from the snapshot's truth, which is where it had
      // drained to anyway — so the correction is invisible.
      key={remainingMs}
      style={{
        '--drain-duration': `${remainingMs}ms`,
        '--drain-from': (remainingMs / durationMs).toFixed(3)
      }}
    >
      {label !== undefined && <span className='label'>{label}</span>}
      <div className='groove' />
      <SecondsLeft durationMs={durationMs} remainingMs={remainingMs} />
    </div>
  )
}

const MILLISECONDS_A_SECOND = 1_000

const wholeSecondsIn = (milliseconds: number): number =>
  Math.ceil(milliseconds / MILLISECONDS_A_SECOND)

/**
 * The figure beside the groove, shaped by the whole clock rather than by what
 * is left of it, so a clock of a minute and a half still reads `0:45` at the
 * end. The full clock's figure is set under it unseen, which holds the box at
 * its widest reading: the groove does not twitch when `10:00` becomes `9:59`.
 */
const SecondsLeft: React.FC<{
  durationMs: number
  remainingMs: number
}> = ({ durationMs, remainingMs }) => {
  const translate = useTranslate()
  const seconds = useSecondsLeft(remainingMs)
  const spanSeconds = wholeSecondsIn(durationMs)

  return (
    // Read by the eye alone: a number announced every second would talk over the round.
    <span aria-hidden className='seconds'>
      <span className='widest'>
        {clockFigure({
          reading: clockReadingOf({ seconds: spanSeconds, spanSeconds }),
          translate
        })}
      </span>
      <span>
        {clockFigure({
          reading: clockReadingOf({ seconds, spanSeconds }),
          translate
        })}
      </span>
    </span>
  )
}

/**
 * Whole seconds left of `remainingMs` read at mount, rendered as each one
 * begins. The bar re-keys on every snapshot, which is what re-reads it.
 */
const useSecondsLeft = (remainingMs: number): number => {
  const [endsAt] = useState(() => nowMs() + remainingMs)
  const [seconds, setSeconds] = useState(() => wholeSecondsIn(remainingMs))

  useEffect(() => {
    let timer = 0

    const tick = (): void => {
      const leftMs = Math.max(0, endsAt - nowMs())

      setSeconds(wholeSecondsIn(leftMs))

      if (leftMs > 0) {
        timer = window.setTimeout(tick, (leftMs % MILLISECONDS_A_SECOND) + 1)
      }
    }

    tick()

    return () => {
      window.clearTimeout(timer)
    }
  }, [endsAt])

  return seconds
}

type RevealHoldProps = {
  /** Server time the reveal gives way to the next round. */
  advancesAt: number
  /** This device's estimate of the server clock; `null` before the first pong. */
  clock: ClockEstimate | null
  /** The whole wait, from the setting its deadline was stamped against. */
  holdMs: number
  /** As the bar's. */
  label?: string
}

/**
 * The same bar, counting the wait between a reveal and the round after it. The
 * hold travels as a deadline rather than as time already spent — the server
 * cancels and restarts it along with the round — so this is where it becomes
 * the two numbers the bar draws with, once rather than on each screen.
 *
 * `nowMs()` in the render body is the point rather than an oversight: the
 * reading is taken once per snapshot and the animation carries the drain in
 * between, which is the same bargain the round's bar makes with the server's
 * own count.
 */
export const RevealHold: React.FC<RevealHoldProps> = ({
  advancesAt,
  clock,
  holdMs,
  label
}) => (
  <RoundProgress
    durationMs={holdMs}
    elapsedMs={holdMs - millisecondsUntil(clock, advancesAt, nowMs())}
    label={label}
  />
)
