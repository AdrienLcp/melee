const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export const minutesSince = ({
  at,
  now
}: {
  at: number
  now: number
}): number => Math.floor((now - at) / MINUTE_MS)

/** How long ago a report came in, in the unit a person reads it in, as a key and a negative count. */
export const receivedAgo = ({
  at,
  now
}: {
  at: number
  now: number
}): {
  key: `admin.reports.received.${'days' | 'hours' | 'minutes'}`
  when: number
} => {
  const elapsed = now - at

  if (elapsed < HOUR_MS) {
    return {
      key: 'admin.reports.received.minutes',
      when: -Math.floor(elapsed / MINUTE_MS)
    }
  }

  return elapsed < 2 * DAY_MS
    ? {
        key: 'admin.reports.received.hours',
        when: -Math.floor(elapsed / HOUR_MS)
      }
    : {
        key: 'admin.reports.received.days',
        when: -Math.floor(elapsed / DAY_MS)
      }
}
