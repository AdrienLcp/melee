import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { nowMs } from '@/infrastructure/clock'

import { createLineSender, LINE_SEND_INTERVAL_MS } from './line-sender'

type Written = { at: number; line: number; text: string }

const recorder = ({
  isDelivered = () => true
}: {
  isDelivered?: () => boolean
} = {}) => {
  const written: Written[] = []
  const sender = createLineSender((line, text) => {
    if (!isDelivered()) {
      return false
    }

    written.push({ at: nowMs(), line, text })

    return true
  })

  return { sender, written }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('a sheet’s lines on their way', () => {
  it('[petitbac] sends a line typed without a pause once every interval, and its last letter once the typing stops', () => {
    const { sender, written } = recorder()
    const word = 'Borrowed blue bicycle with a broken bell'
    const keystrokeMs = 40
    const startedAt = nowMs()

    for (let length = 1; length <= word.length; length += 1) {
      sender.change(0, word.slice(0, length))
      vi.advanceTimersByTime(keystrokeMs)
    }

    const typedFor = nowMs() - startedAt

    vi.advanceTimersByTime(LINE_SEND_INTERVAL_MS)

    const times = [startedAt, ...written.map(({ at }) => at)]
    const gaps = times.slice(1).map((at, index) => at - (times[index] ?? 0))

    expect(written.length).toBeGreaterThanOrEqual(
      Math.floor(typedFor / LINE_SEND_INTERVAL_MS)
    )
    expect(Math.max(...gaps)).toBeLessThanOrEqual(LINE_SEND_INTERVAL_MS)
    expect(written.at(-1)?.text).toBe(word)
  })

  it('[petitbac] sends every line still being typed the moment it is flushed, and nothing twice', () => {
    const { sender, written } = recorder()

    sender.change(0, 'Bra')
    vi.advanceTimersByTime(LINE_SEND_INTERVAL_MS)
    sender.change(0, 'Brazil')
    sender.change(2, 'Bas')
    sender.flush()

    expect(written.map(({ line, text }) => `${line}:${text}`)).toEqual([
      '0:Bra',
      '0:Brazil',
      '2:Bas'
    ])

    vi.advanceTimersByTime(LINE_SEND_INTERVAL_MS * 3)
    sender.flush()

    expect(written).toHaveLength(3)
  })

  it('[petitbac] sends a line again whose frame was never written', () => {
    let isUp = false
    const { sender, written } = recorder({ isDelivered: () => isUp })

    sender.change(1, 'Bison')
    sender.flush()
    isUp = true
    sender.flush()

    expect(written.map(({ text }) => text)).toEqual(['Bison'])
  })
})
