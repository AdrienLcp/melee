import { describe, expect, it } from 'vitest'

import { playerScreenLanding, swapsThePlayerScreen } from './player-screen-swap'

const at = (
  phase: 'buzzed' | 'countdown' | 'finished' | 'lobby' | 'playing' | 'revealed',
  { isHostConnected = true, isPaused = false } = {}
) => ({ isHostConnected, isPaused, phase })

describe('swapsThePlayerScreen', () => {
  it('[screen] replaces the lobby, the reveal and the final board as they come and go', () => {
    expect(
      swapsThePlayerScreen({ from: at('lobby'), to: at('countdown') })
    ).toBe(true)
    expect(
      swapsThePlayerScreen({ from: at('playing'), to: at('revealed') })
    ).toBe(true)
    expect(
      swapsThePlayerScreen({ from: at('buzzed'), to: at('revealed') })
    ).toBe(true)
    expect(
      swapsThePlayerScreen({ from: at('revealed'), to: at('countdown') })
    ).toBe(true)
    expect(
      swapsThePlayerScreen({ from: at('countdown'), to: at('finished') })
    ).toBe(true)
    expect(
      swapsThePlayerScreen({ from: at('finished'), to: at('lobby') })
    ).toBe(true)
  })

  it('[screen] never holds a press: the floor changing hands, the round dealt, a freeze lifted', () => {
    expect(
      swapsThePlayerScreen({ from: at('playing'), to: at('buzzed') })
    ).toBe(false)
    expect(
      swapsThePlayerScreen({ from: at('buzzed'), to: at('playing') })
    ).toBe(false)
    expect(
      swapsThePlayerScreen({ from: at('countdown'), to: at('playing') })
    ).toBe(false)
    expect(
      swapsThePlayerScreen({
        from: at('playing', { isPaused: true }),
        to: at('playing')
      })
    ).toBe(false)
    expect(
      swapsThePlayerScreen({
        from: at('playing', { isHostConnected: false }),
        to: at('playing')
      })
    ).toBe(false)
  })

  it('[screen] replaces a round frozen, and leaves the reveal its own word for the host away', () => {
    expect(
      swapsThePlayerScreen({
        from: at('playing'),
        to: at('playing', { isPaused: true })
      })
    ).toBe(true)
    expect(
      swapsThePlayerScreen({
        from: at('playing'),
        to: at('playing', { isHostConnected: false })
      })
    ).toBe(true)
    expect(
      swapsThePlayerScreen({
        from: at('revealed'),
        to: at('revealed', { isHostConnected: false })
      })
    ).toBe(false)
  })

  it('[screen] draws the first view as it comes', () => {
    expect(swapsThePlayerScreen({ from: null, to: at('revealed') })).toBe(false)
  })
})

describe('playerScreenLanding', () => {
  it('[screen] fades the countdown off over the round it counted in, which takes presses at once', () => {
    expect(
      playerScreenLanding({ from: at('countdown'), to: at('playing') })
    ).toBe('faded-over')
  })

  it('[screen] draws the floor changing hands as it comes', () => {
    expect(playerScreenLanding({ from: at('buzzed'), to: at('playing') })).toBe(
      'drawn'
    )
  })

  it('[screen] swaps what swapsThePlayerScreen lists', () => {
    expect(
      playerScreenLanding({ from: at('playing'), to: at('revealed') })
    ).toBe('swapped')
  })
})
