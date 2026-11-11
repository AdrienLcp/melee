import { describe, expect, it } from 'vitest'

import { roundIdSchema } from '@melee/protocol/identifiers'

import { leavesTheReveal } from './reveal-departure'

const round = { id: roundIdSchema.parse('round-1') }
const next = { id: roundIdSchema.parse('round-2') }

describe('leavesTheReveal', () => {
  it('[reveal] plays the reveal giving way to the next countdown or the final board', () => {
    expect(
      leavesTheReveal({
        from: { phase: 'revealed', round },
        to: { phase: 'countdown', round: next }
      })
    ).toBe(true)
    expect(
      leavesTheReveal({
        from: { phase: 'revealed', round },
        to: { phase: 'finished', round }
      })
    ).toBe(true)
  })

  it('[reveal] leaves a snapshot that keeps the reveal up alone', () => {
    expect(
      leavesTheReveal({
        from: { phase: 'revealed', round },
        to: { phase: 'revealed', round }
      })
    ).toBe(false)
  })

  it('[reveal] leaves the reveal arriving to its own motion', () => {
    expect(
      leavesTheReveal({
        from: { phase: 'buzzed', round },
        to: { phase: 'revealed', round }
      })
    ).toBe(false)
  })

  it('[reveal] has nothing to leave before the first view', () => {
    expect(
      leavesTheReveal({ from: null, to: { phase: 'countdown', round: next } })
    ).toBe(false)
  })
})
