import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { LeanAnswer } from '@melee/protocol/client-message'

import { createLeanSender } from './lean-sender'

const DELAY_MS = 300

const rack = (value: number): LeanAnswer => ({
  kind: 'calculation',
  steps: [{ left: 0, operator: 'add', right: value }]
})

const recorder = () => {
  let isOpen = true
  const written: (LeanAnswer | null)[] = []
  const sender = createLeanSender((answer) => {
    if (!isOpen) {
      return false
    }

    written.push(answer)

    return true
  })

  return {
    close: () => {
      isOpen = false
    },
    reopen: () => {
      isOpen = true
    },
    sender,
    written
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('a lean on its way', () => {
  it('[lean] writes the latest state once the delay ends, the states before it dropped', () => {
    const { sender, written } = recorder()

    sender.lean(rack(1), DELAY_MS)
    sender.lean(rack(2), DELAY_MS)
    vi.advanceTimersByTime(DELAY_MS)

    expect(written).toEqual([rack(2)])
  })

  it('[lean] keeps a lean whose frame was never written, and writes it once the socket reopens', () => {
    const { close, reopen, sender, written } = recorder()

    close()
    sender.lean(rack(3), DELAY_MS)
    vi.advanceTimersByTime(DELAY_MS)

    expect(written).toEqual([])

    reopen()
    sender.resend()

    expect(written).toEqual([rack(3)])
  })

  it('[lean] writes a lean never written with the next one, the latest winning', () => {
    const { close, reopen, sender, written } = recorder()

    close()
    sender.lean(rack(3), DELAY_MS)
    vi.advanceTimersByTime(DELAY_MS)
    reopen()
    sender.lean(rack(4), DELAY_MS)
    vi.advanceTimersByTime(DELAY_MS)

    expect(written).toEqual([rack(4)])
  })

  it('[lean] writes the last lean again on a reopened socket, though its frame was written into the one that died', () => {
    const { sender, written } = recorder()

    sender.lean(rack(5), DELAY_MS)
    vi.advanceTimersByTime(DELAY_MS)
    sender.resend()

    expect(written).toEqual([rack(5), rack(5)])
  })

  it('[lean] writes nothing on a reopened socket once the answer itself was sent', () => {
    const { sender, written } = recorder()

    sender.lean(rack(6), DELAY_MS)
    sender.cancel()
    vi.advanceTimersByTime(DELAY_MS)
    sender.resend()

    expect(written).toEqual([])
  })

  it('[lean] writes a lean taken back as taken back on a reopened socket', () => {
    const { sender, written } = recorder()

    sender.lean(rack(7), DELAY_MS)
    sender.lean(null, DELAY_MS)
    vi.advanceTimersByTime(DELAY_MS)
    sender.resend()

    expect(written).toEqual([null, null])
  })
})
