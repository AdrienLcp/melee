import type { BugReport } from '@melee/protocol/http'

const bytesOf = (value: unknown): number =>
  new TextEncoder().encode(JSON.stringify(value)).length

/**
 * A report brought under `maxBytes`: the room view goes first, since the
 * server holds the same room, then the oldest events an eighth at a time —
 * the newest are the moment it broke. `null` when even an empty trail is too
 * big, which only fields past their own caps could make.
 */
export const fittedBugReport = ({
  maxBytes,
  report
}: {
  maxBytes: number
  report: BugReport
}): BugReport | null => {
  if (bytesOf(report) <= maxBytes) {
    return report
  }

  let fitted: BugReport = { ...report, view: null }

  while (bytesOf(fitted) > maxBytes) {
    if (fitted.events.length === 0) {
      return null
    }

    fitted = {
      ...fitted,
      events: fitted.events.slice(Math.ceil(fitted.events.length / 8))
    }
  }

  return fitted
}
