const SECONDS_A_MINUTE = 60

/** A clock's figure, before a locale writes it. */
export type ClockReading =
  | { kind: 'minutes'; minutes: number; seconds: number }
  | { kind: 'seconds'; seconds: number }

/**
 * Reads a whole number of seconds as a clock prints it: `m:ss` for a clock of a
 * minute or more, bare seconds under one.
 *
 * The span decides rather than the reading, so a clock never changes shape
 * mid-round: a minute and a half reads `0:45` at three quarters, where a
 * forty-five-second clock reads `45`. A clock counting up has no span, and
 * changes shape once, at its first minute.
 */
export const clockReadingOf = ({
  seconds,
  spanSeconds
}: {
  /** The whole seconds the clock shows now. */
  seconds: number
  /** The whole seconds it showed when it started; `null` when it counts up with no end. */
  spanSeconds: number | null
}): ClockReading =>
  (spanSeconds ?? seconds) >= SECONDS_A_MINUTE
    ? {
        kind: 'minutes',
        minutes: Math.floor(seconds / SECONDS_A_MINUTE),
        seconds: seconds % SECONDS_A_MINUTE
      }
    : { kind: 'seconds', seconds }
