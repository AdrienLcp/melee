import { describe, expect, it } from 'vitest'

import { playerIdSchema } from '@melee/protocol/identifiers'

import {
  type ConsoleStageOnScreen,
  consoleStageLanding,
  replacesTheStage,
  wallStageLanding
} from './stage-replacement'

const SEAT = playerIdSchema.parse('seat-1')

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

describe('consoleStageLanding', () => {
  const seated = (
    stage: Omit<ConsoleStageOnScreen, 'youId'>
  ): ConsoleStageOnScreen => ({ ...stage, youId: SEAT })
  const unseated = (
    stage: Omit<ConsoleStageOnScreen, 'youId'>
  ): ConsoleStageOnScreen => ({ ...stage, youId: null })

  it('[stage] fades the stage off a copy where a seated console has a race to answer', () => {
    expect(
      consoleStageLanding({
        from: seated({ isPaused: true, phase: 'playing' }),
        to: seated({ isPaused: false, phase: 'playing' })
      })
    ).toBe('faded-over')
    expect(
      consoleStageLanding({
        from: seated({ isPaused: false, phase: 'buzzed' }),
        to: seated({ isPaused: false, phase: 'playing' })
      })
    ).toBe('faded-over')
    expect(
      consoleStageLanding({
        from: seated({ isPaused: false, phase: 'countdown' }),
        to: seated({ isPaused: false, phase: 'playing' })
      })
    ).toBe('faded-over')
  })

  it('[stage] swaps every other replacement, and every one on a console with no seat', () => {
    expect(
      consoleStageLanding({
        from: seated({ isPaused: false, phase: 'playing' }),
        to: seated({ isPaused: true, phase: 'playing' })
      })
    ).toBe('swapped')
    expect(
      consoleStageLanding({
        from: seated({ isPaused: false, phase: 'playing' }),
        to: seated({ isPaused: false, phase: 'revealed' })
      })
    ).toBe('swapped')
    expect(
      consoleStageLanding({
        from: unseated({ isPaused: true, phase: 'playing' }),
        to: unseated({ isPaused: false, phase: 'playing' })
      })
    ).toBe('swapped')
  })

  it('[stage] draws a snapshot that keeps the stage, and the first one', () => {
    expect(
      consoleStageLanding({
        from: seated({ isPaused: false, phase: 'playing' }),
        to: seated({ isPaused: false, phase: 'playing' })
      })
    ).toBe('drawn')
    expect(
      consoleStageLanding({
        from: null,
        to: seated({ isPaused: false, phase: 'playing' })
      })
    ).toBe('drawn')
  })
})

describe('wallStageLanding', () => {
  it('[stage] swaps the arrival line for the first view', () => {
    expect(
      wallStageLanding({
        from: null,
        to: { isPaused: false, phase: 'lobby' }
      })
    ).toBe('swapped')
  })

  it('[stage] draws a snapshot that keeps the stage', () => {
    expect(
      wallStageLanding({
        from: { isPaused: false, phase: 'lobby' },
        to: { isPaused: false, phase: 'lobby' }
      })
    ).toBe('drawn')
  })
})
