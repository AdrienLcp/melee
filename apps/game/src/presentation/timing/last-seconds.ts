import { useEffect, useEffectEvent, useRef } from 'react'

import type { RoomPhase, RoundView } from '@melee/protocol/room'

import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import { nowMs } from '@/infrastructure/clock'

/**
 * What is counting down on screen right now:
 * - `countdown` — the count into a round, to its first note
 * - `round` — the round's own clock, which a buzz pauses
 * - `floor` — the window a buzz holds the floor for
 */
export type DeadlineKind = 'countdown' | 'floor' | 'round'

export type Deadline = {
  /** What stays the same across re-delivered snapshots of one countdown. */
  id: string
  kind: DeadlineKind
  /** Read once per snapshot; the hook counts the rest itself. */
  remainingMs: number
}

/** The fields of any role's view a deadline is read from. */
export type TimedView = {
  isHostConnected: boolean
  isPaused: boolean
  phase: RoomPhase
  round: Pick<
    RoundView,
    'activeBuzz' | 'content' | 'durationMs' | 'id' | 'startsAt'
  > | null
  roundElapsedMs: number
}

/**
 * When the round's open phase ends, as round time, and `null` once it has no
 * clock left. A Petit Bac runs its vote inside `playing` on a clock that keeps
 * counting, so the sheets closing — on the clock or a stop's grace — is the
 * end, and what follows must not tick the round's last seconds over the vote.
 */
const openPhaseEndOf = (
  round: NonNullable<TimedView['round']>
): { endsAtElapsedMs: number; key: string } | null => {
  if (round.durationMs === null) {
    return null
  }

  if (round.content.kind !== 'petitbac') {
    return { endsAtElapsedMs: round.durationMs, key: 'clock' }
  }

  if (round.content.sheetsClosed) {
    return null
  }

  const stopAt = round.content.stopClosesAtElapsedMs

  return stopAt === null || stopAt >= round.durationMs
    ? { endsAtElapsedMs: round.durationMs, key: 'clock' }
    : { endsAtElapsedMs: stopAt, key: `stop:${stopAt}` }
}

/**
 * `null` whenever nothing counts down — a round with no clock, a floor held
 * until the host judges, and a round the server froze because its host left
 * or paused it.
 *
 * The round's clock is the server's count of time consumed rather than a
 * deadline, because a buzz pauses it: the deadline only exists between two
 * snapshots, as now plus what is left.
 */
export const currentDeadline = ({
  clock,
  view
}: {
  clock: ClockEstimate | null
  view: TimedView
}): Deadline | null => {
  const round = view.round

  if (round === null || view.isPaused) {
    return null
  }

  if (view.phase === 'countdown' && round.startsAt !== null) {
    return {
      id: `countdown:${round.id}`,
      kind: 'countdown',
      remainingMs: millisecondsUntil(clock, round.startsAt, nowMs())
    }
  }

  const openPhaseEnd = openPhaseEndOf(round)

  if (
    view.phase === 'playing' &&
    view.isHostConnected &&
    openPhaseEnd !== null
  ) {
    return {
      id: `round:${round.id}:${openPhaseEnd.key}`,
      kind: 'round',
      remainingMs: Math.max(
        0,
        openPhaseEnd.endsAtElapsedMs - view.roundElapsedMs
      )
    }
  }

  const buzz = round.activeBuzz

  if (view.phase === 'buzzed' && buzz !== null && buzz.expiresAt !== null) {
    return {
      id: `floor:${buzz.atServerTime}`,
      kind: 'floor',
      remainingMs: millisecondsUntil(clock, buzz.expiresAt, nowMs())
    }
  }

  return null
}

/**
 * How close to its end a countdown may vanish and still count as having run
 * out: the snapshot that ends a round can land before this screen's own count
 * reaches nought, and a round everyone answered early must not sound as if
 * time had run out.
 */
const RAN_OUT_WITHIN_MS = 400

/**
 * How late a second's tick may still sound. A snapshot landing mid-second, a
 * screen mounting mid-round or a throttled timer would otherwise tick a second
 * already half gone, and the ear hears it crowd the next one: past this, the
 * second goes by silent and the count picks up on the next whole one.
 */
const LATEST_TICK_MS = 150

/**
 * How late the first second of the count into a round may still sound. Its
 * snapshot lands a server timer and a network trip after the count began, past
 * `LATEST_TICK_MS` often enough that the room heard two beeps under a 3, 2, 1
 * on screen. This late, the next tick is still four hundred milliseconds off.
 */
const LATEST_COUNT_IN_TICK_MS = 600

export type SecondMark =
  | { kind: 'end' }
  | { kind: 'same' }
  | { kind: 'silent' | 'tick'; second: number }

/**
 * What `leftMs` says to do, given the last whole second already marked: the
 * countdown has ended, nothing new has begun, or a new second has — ticked
 * when it is one of the last `fromSecond` and began no more than
 * `LATEST_TICK_MS` ago, or `LATEST_COUNT_IN_TICK_MS` for the first second of
 * the count into a round.
 */
export const markSecond = ({
  fromSecond,
  kind,
  leftMs,
  markedSecond
}: {
  fromSecond: number
  kind: DeadlineKind
  leftMs: number
  markedSecond: number
}): SecondMark => {
  const second = Math.ceil(leftMs / 1_000)

  if (second <= 0) {
    return { kind: 'end' }
  }

  if (second >= markedSecond) {
    return { kind: 'same' }
  }

  const lateMs = second * 1_000 - leftMs
  const latestTickMs =
    kind === 'countdown' && markedSecond === Number.POSITIVE_INFINITY
      ? LATEST_COUNT_IN_TICK_MS
      : LATEST_TICK_MS

  return {
    kind: second <= fromSecond && lateMs <= latestTickMs ? 'tick' : 'silent',
    second
  }
}

type Marks = {
  endsAt: number
  hasEnded: boolean
  id: string
  kind: DeadlineKind
  /** The last whole second marked, so a re-delivered snapshot never marks it twice. */
  second: number
}

/**
 * Calls `onSecond` as each of the last `fromSecond` whole seconds begins, and
 * `onEnd` once when the countdown runs out — on this screen's count or on the
 * snapshot that closes it, whichever lands first.
 */
export const useLastSeconds = ({
  deadline,
  fromSecond,
  onEnd,
  onSecond
}: {
  deadline: Deadline | null
  fromSecond: number
  onEnd: (kind: DeadlineKind) => void
  onSecond: (second: number, kind: DeadlineKind) => void
}): void => {
  const marksRef = useRef<Marks | null>(null)
  const end = useEffectEvent(onEnd)
  const mark = useEffectEvent(onSecond)
  const id = deadline?.id ?? null
  const kind = deadline?.kind ?? null
  const remainingMs = deadline?.remainingMs ?? null

  useEffect(() => {
    const previous = marksRef.current

    if (id === null || kind === null || remainingMs === null) {
      if (
        previous !== null &&
        !previous.hasEnded &&
        previous.endsAt - nowMs() < RAN_OUT_WITHIN_MS
      ) {
        end(previous.kind)
      }

      marksRef.current = null

      return
    }

    const marks: Marks =
      previous?.id === id
        ? previous
        : {
            endsAt: 0,
            hasEnded: false,
            id,
            kind,
            second: Number.POSITIVE_INFINITY
          }

    marks.endsAt = nowMs() + remainingMs
    marksRef.current = marks

    let timer = 0

    const check = (): void => {
      const leftMs = marks.endsAt - nowMs()
      const next = markSecond({
        fromSecond,
        kind,
        leftMs,
        markedSecond: marks.second
      })

      if (next.kind === 'end') {
        if (!marks.hasEnded) {
          marks.hasEnded = true
          end(kind)
        }

        return
      }

      if (next.kind !== 'same') {
        marks.second = next.second

        if (next.kind === 'tick') {
          mark(next.second, kind)
        }
      }

      timer = window.setTimeout(check, (leftMs % 1_000) + 1)
    }

    check()

    return () => {
      window.clearTimeout(timer)
    }
  }, [fromSecond, id, kind, remainingMs])
}
