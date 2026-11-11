import { describe, expect, it } from 'vitest'

import { playerIdSchema } from '@melee/protocol/identifiers'
import type { RoomPhase } from '@melee/protocol/room'

import {
  type ConsoleStageOnScreen,
  consoleStageLanding,
  replacesTheStage,
  type StageOnScreen,
  wallStageLanding
} from './stage-replacement'

const SEAT = playerIdSchema.parse('seat-1')

const onStage = (
  phase: RoomPhase,
  { isPaused = false }: { isPaused?: boolean } = {}
): NonNullable<StageOnScreen> => ({ isPaused, phase, round: null })

const petitBac = ({
  sheetsClosed
}: {
  sheetsClosed: boolean
}): NonNullable<StageOnScreen> => ({
  isPaused: false,
  phase: 'playing',
  round: { content: { kind: 'petitbac', sheetsClosed } }
})

describe('replacesTheStage', () => {
  it('[stage] plays every change of phase, the floor changing hands included', () => {
    expect(
      replacesTheStage({
        from: onStage('lobby'),
        to: onStage('countdown')
      })
    ).toBe(true)
    expect(
      replacesTheStage({
        from: onStage('playing'),
        to: onStage('buzzed')
      })
    ).toBe(true)
    expect(
      replacesTheStage({
        from: onStage('finished'),
        to: onStage('lobby')
      })
    ).toBe(true)
  })

  it('[stage] plays a pause taken and lifted', () => {
    expect(
      replacesTheStage({
        from: onStage('playing'),
        to: onStage('playing', { isPaused: true })
      })
    ).toBe(true)
    expect(
      replacesTheStage({
        from: onStage('playing', { isPaused: true }),
        to: onStage('playing')
      })
    ).toBe(true)
  })

  it("[stage] plays Petit Bac's sheets closing on the vote, inside the round", () => {
    expect(
      replacesTheStage({
        from: petitBac({ sheetsClosed: false }),
        to: petitBac({ sheetsClosed: true })
      })
    ).toBe(true)
    expect(
      replacesTheStage({
        from: petitBac({ sheetsClosed: true }),
        to: petitBac({ sheetsClosed: true })
      })
    ).toBe(false)
  })

  it('[stage] leaves a snapshot that keeps the stage alone, and the first one', () => {
    expect(
      replacesTheStage({
        from: onStage('playing'),
        to: onStage('playing')
      })
    ).toBe(false)
    expect(
      replacesTheStage({
        from: null,
        to: onStage('revealed')
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
        from: seated(onStage('playing', { isPaused: true })),
        to: seated(onStage('playing'))
      })
    ).toBe('faded-over')
    expect(
      consoleStageLanding({
        from: seated(onStage('buzzed')),
        to: seated(onStage('playing'))
      })
    ).toBe('faded-over')
    expect(
      consoleStageLanding({
        from: seated(onStage('countdown')),
        to: seated(onStage('playing'))
      })
    ).toBe('faded-over')
  })

  it('[stage] swaps every other replacement, and every one on a console with no seat', () => {
    expect(
      consoleStageLanding({
        from: seated(onStage('playing')),
        to: seated(onStage('playing', { isPaused: true }))
      })
    ).toBe('swapped')
    expect(
      consoleStageLanding({
        from: seated(onStage('playing')),
        to: seated(onStage('revealed'))
      })
    ).toBe('swapped')
    expect(
      consoleStageLanding({
        from: unseated(onStage('playing', { isPaused: true })),
        to: unseated(onStage('playing'))
      })
    ).toBe('swapped')
  })

  it("[stage] swaps Petit Bac's vote in on a seated console, since it opens no race", () => {
    expect(
      consoleStageLanding({
        from: seated(petitBac({ sheetsClosed: false })),
        to: seated(petitBac({ sheetsClosed: true }))
      })
    ).toBe('swapped')
  })

  it('[stage] draws a snapshot that keeps the stage, and the first one', () => {
    expect(
      consoleStageLanding({
        from: seated(onStage('playing')),
        to: seated(onStage('playing'))
      })
    ).toBe('drawn')
    expect(
      consoleStageLanding({
        from: null,
        to: seated(onStage('playing'))
      })
    ).toBe('drawn')
  })
})

describe('wallStageLanding', () => {
  it('[stage] swaps the arrival line for the first view', () => {
    expect(
      wallStageLanding({
        from: null,
        to: onStage('lobby')
      })
    ).toBe('swapped')
  })

  it('[stage] draws a snapshot that keeps the stage', () => {
    expect(
      wallStageLanding({
        from: onStage('lobby'),
        to: onStage('lobby')
      })
    ).toBe('drawn')
  })

  it("[stage] swaps Petit Bac's vote in", () => {
    expect(
      wallStageLanding({
        from: petitBac({ sheetsClosed: false }),
        to: petitBac({ sheetsClosed: true })
      })
    ).toBe('swapped')
  })
})
