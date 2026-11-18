import type React from 'react'
import { useState } from 'react'

import type { RoundContent } from '@melee/protocol/room'

import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import { nowMs } from '@/infrastructure/clock'
import { RoundProgress } from '@/presentation/components/round-progress'

type FiveCluesWindowProps = {
  clock: ClockEstimate | null
  content: Extract<RoundContent, { kind: 'fiveclues' }>
}

const MILLISECONDS_A_SECOND = 1_000

/**
 * The open clue's window draining to `nextClueAt`, in server time read
 * through the clock offset as the reflex reads `flipsAt`. While the clock is
 * stopped — the floor held, a pause — `nextClueAt` is `null` and the server
 * hands the remainder back after, so the bar stands where it had drained to
 * when it stopped.
 */
export const FiveCluesWindow: React.FC<FiveCluesWindowProps> = ({
  clock,
  content
}) => {
  const { clueDurationMs, nextClueAt, openClueIndex } = content
  const windowKey = `${openClueIndex}:${nextClueAt ?? 'stopped'}`
  const [stoppedAt, setStoppedAt] = useState<{
    key: string
    leftMs: number
  } | null>(null)
  const [lastRunningAt, setLastRunningAt] = useState<{
    at: number
    openClueIndex: number
  } | null>(nextClueAt === null ? null : { at: nextClueAt, openClueIndex })

  if (nextClueAt !== null && nextClueAt !== lastRunningAt?.at) {
    setLastRunningAt({ at: nextClueAt, openClueIndex })
  }

  if (nextClueAt !== null) {
    const leftMs = Math.min(
      clueDurationMs,
      Math.max(0, millisecondsUntil(clock, nextClueAt, nowMs()))
    )

    return (
      <RoundProgress
        durationMs={clueDurationMs}
        elapsedMs={clueDurationMs - leftMs}
      />
    )
  }

  if (stoppedAt?.key !== windowKey) {
    setStoppedAt({
      key: windowKey,
      leftMs:
        lastRunningAt?.openClueIndex === openClueIndex
          ? Math.min(
              clueDurationMs,
              Math.max(0, millisecondsUntil(clock, lastRunningAt.at, nowMs()))
            )
          : clueDurationMs
    })
  }

  const leftMs = stoppedAt?.leftMs ?? clueDurationMs

  return (
    <div
      className='round-progress'
      data-stopped
      style={{ '--drain-from': (leftMs / clueDurationMs).toFixed(3) }}
    >
      <div className='groove' />
      <span aria-hidden className='seconds'>
        {Math.ceil(leftMs / MILLISECONDS_A_SECOND)}
      </span>
    </div>
  )
}
