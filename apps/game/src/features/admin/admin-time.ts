const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

/** How long ago something happened, in the unit a person reads it in, as a key and a negative count. */
export const timeAgo = ({
  at,
  now
}: {
  at: number
  now: number
}): {
  key: `admin.ago.${'days' | 'hours' | 'minutes'}`
  when: number
} => {
  const elapsed = now - at

  if (elapsed < HOUR_MS) {
    return {
      key: 'admin.ago.minutes',
      when: -Math.floor(elapsed / MINUTE_MS)
    }
  }

  return elapsed < 2 * DAY_MS
    ? {
        key: 'admin.ago.hours',
        when: -Math.floor(elapsed / HOUR_MS)
      }
    : {
        key: 'admin.ago.days',
        when: -Math.floor(elapsed / DAY_MS)
      }
}
