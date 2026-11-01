/**
 * The only reader of the wall clock: epoch milliseconds, the unit every
 * deadline on the wire and every `setTimeout` here is written in.
 */
export const nowMs = (): number => Date.now()

const MS_PER_DAY = 86_400_000

/** Midnight of the local calendar day holding `ms`, counted as if every day were as long. */
const localDayOf = (ms: number): number => {
  const date = new Date(ms)

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Whole local calendar days from `from` to `to`, negative when `to` is earlier:
 * yesterday at 23:00 to today at 10:00 is one, today at 01:00 to today at
 * 23:00 is none, whatever a clock change did to the hours between.
 */
export const calendarDaysBetween = ({
  from,
  to
}: {
  from: number
  to: number
}): number => (localDayOf(to) - localDayOf(from)) / MS_PER_DAY
