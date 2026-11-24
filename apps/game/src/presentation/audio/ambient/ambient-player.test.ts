import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { startAmbient } from './ambient-player'

type Ramp = { constant: number; target: number }

const fakeFader = () => {
  const ramps: Ramp[] = []

  return {
    disconnect: vi.fn(),
    gain: {
      cancelScheduledValues: (_at: number) => undefined,
      linearRampToValueAtTime: (_value: number, _at: number) => undefined,
      setTargetAtTime: (value: number, _at: number, constant: number) => {
        ramps.push({ constant, target: value })
      },
      setValueAtTime: (_value: number, _at: number) => undefined,
      value: 0
    },
    ramps
  }
}

const start = () => {
  const clock = { time: 0 }
  const bus = fakeFader()
  const playedBars: number[] = []
  const beginPiece = vi.fn(() => ({
    fader: fakeFader(),
    piece: {
      bars: 16,
      playBar: ({ bar }: { bar: number }) => {
        playedBars.push(bar)
      },
      secondsPerBar: 2,
      sections: []
    }
  }))
  const player = startAmbient({ beginPiece, bus, now: () => clock.time })

  return { beginPiece, bus, clock, playedBars, player }
}

describe('startAmbient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('[ambient] writes nothing before a mood is given', () => {
    const { player, playedBars } = start()

    player.setLevel(0.35)
    vi.advanceTimersByTime(1_000)

    expect(playedBars).toEqual([])
  })

  it('[ambient] swells in on a mood and gives way faster than it returns', () => {
    const { bus, player } = start()

    player.setLevel(0.35)
    player.setMood('calm')
    player.setMood(null)

    expect(bus.ramps).toEqual([
      { constant: 1.4, target: 0.35 },
      { constant: 0.45, target: 0 }
    ])
  })

  it('[ambient] keeps its level through a change of mood', () => {
    const { bus, player } = start()

    player.setLevel(0.35)
    player.setMood('calm')
    player.setMood('lively')

    expect(bus.ramps).toHaveLength(1)
  })

  it('[ambient] starts the next piece over the outro of the last', () => {
    const { beginPiece, clock, player } = start()

    player.setLevel(0.35)
    player.setMood('calm')
    clock.time = 28
    vi.advanceTimersByTime(250)

    expect(beginPiece).toHaveBeenCalledTimes(2)
  })

  it('[ambient] lets its pieces go once faded out', () => {
    const { beginPiece, bus, player } = start()

    player.setLevel(0.35)
    player.setMood('final')

    const [first] = beginPiece.mock.results

    player.setMood(null)
    bus.gain.value = 0
    vi.advanceTimersByTime(250)

    expect(first?.value.fader.disconnect).toHaveBeenCalled()

    player.setMood('final')

    expect(beginPiece).toHaveBeenCalledTimes(2)
  })
})
