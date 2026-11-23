import type { LeanAnswer } from '@melee/protocol/client-message'

/** What a seat's screen holds and has not sent, on its way to the server — see `player.lean`. */
export type LeanSender = {
  /** Drops what is waiting and forgets the last lean, for the press that sends the answer itself. */
  cancel: () => void
  /** Stops the timer, for a screen leaving. */
  dispose: () => void
  /** The screen's state as it now stands, written after `delayMs` unless a write is already waiting, the latest state winning. */
  lean: (answer: LeanAnswer | null, delayMs: number) => void
  /** Writes the last lean again, now: a frame written into a socket that was dying never arrived, so a reopened one is owed it. */
  resend: () => void
}

/**
 * Holds the latest lean until a write takes it. A lean whose frame was never
 * written stays owed, and goes with the next lean or the next `resend`, so a
 * rack built through a Wi-Fi blink is not lost with the blink.
 */
export const createLeanSender = (
  /** `false` when the frame was never written. */
  write: (answer: LeanAnswer | null) => boolean
): LeanSender => {
  let last: { answer: LeanAnswer | null } | null = null
  let isOwed = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const dispose = (): void => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const flush = (): void => {
    dispose()

    if (isOwed && last !== null && write(last.answer)) {
      isOwed = false
    }
  }

  const lean = (answer: LeanAnswer | null, delayMs: number): void => {
    last = { answer }
    isOwed = true

    if (timer === null) {
      timer = setTimeout(flush, delayMs)
    }
  }

  const resend = (): void => {
    if (last !== null) {
      isOwed = true
      flush()
    }
  }

  const cancel = (): void => {
    dispose()
    last = null
    isOwed = false
  }

  return { cancel, dispose, lean, resend }
}
