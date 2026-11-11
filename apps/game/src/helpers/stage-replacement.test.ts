import { describe, expect, it } from 'vitest'

import { replacesTheStage } from './stage-replacement'

describe('replacesTheStage', () => {
  it('[stage] plays every change of phase, the floor changing hands included', () => {
    expect(
      replacesTheStage({
        from: { isPaused: false, phase: 'lobby' },
        to: { isPaused: false, phase: 'countdown' }
      })
    ).toBe(true)
    expect(
      replacesTheStage({
        from: { isPaused: false, phase: 'playing' },
        to: { isPaused: false, phase: 'buzzed' }
      })
    ).toBe(true)
    expect(
      replacesTheStage({
        from: { isPaused: false, phase: 'finished' },
        to: { isPaused: false, phase: 'lobby' }
      })
    ).toBe(true)
  })

  it('[stage] plays a pause taken and lifted', () => {
    expect(
      replacesTheStage({
        from: { isPaused: false, phase: 'playing' },
        to: { isPaused: true, phase: 'playing' }
      })
    ).toBe(true)
    expect(
      replacesTheStage({
        from: { isPaused: true, phase: 'playing' },
        to: { isPaused: false, phase: 'playing' }
      })
    ).toBe(true)
  })

  it('[stage] leaves a snapshot that keeps the stage alone, and the first one', () => {
    expect(
      replacesTheStage({
        from: { isPaused: false, phase: 'playing' },
        to: { isPaused: false, phase: 'playing' }
      })
    ).toBe(false)
    expect(
      replacesTheStage({
        from: null,
        to: { isPaused: false, phase: 'revealed' }
      })
    ).toBe(false)
  })
})
