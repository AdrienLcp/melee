import { nowMs } from '@/infrastructure/clock'

/**
 * How often a line being typed is sent. A throttle rather than a debounce: a
 * hand that never pauses would otherwise send nothing until the sheet closed
 * under it, and the word would be lost.
 */
export const LINE_SEND_INTERVAL_MS = 300

/** A sheet's lines on their way to the server, each as it stands on screen. */
export type LineSender = {
  /** A line's text as it now stands; sent within `LINE_SEND_INTERVAL_MS`, the latest text winning. */
  change: (line: number, text: string) => void
  /** Drops what is waiting, for a sheet leaving the screen. */
  dispose: () => void
  /** Sends every line not yet sent, now: a field left, a stop called, the sheet closing. */
  flush: () => void
}

/**
 * Sends a changed line at once when nothing went out in the last interval,
 * and otherwise as the interval ends, so a sheet typed without a pause goes
 * out once every `LINE_SEND_INTERVAL_MS`. A line whose frame was never
 * written stays unsent, and goes with the next send.
 */
export const createLineSender = (
  /** `false` when the frame was never written. */
  write: (line: number, text: string) => boolean
): LineSender => {
  const latest = new Map<number, string>()
  const sent = new Map<number, string>()
  let lastSentAt = Number.NEGATIVE_INFINITY
  let timer: ReturnType<typeof setTimeout> | null = null

  const dispose = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const flush = (): void => {
    dispose()

    for (const [line, text] of latest) {
      if (sent.get(line) !== text && write(line, text)) {
        sent.set(line, text)
        lastSentAt = nowMs()
      }
    }
  }

  const change = (line: number, text: string): void => {
    latest.set(line, text)

    if (timer === null) {
      timer = setTimeout(
        flush,
        Math.max(0, lastSentAt + LINE_SEND_INTERVAL_MS - nowMs())
      )
    }
  }

  return { change, dispose, flush }
}
