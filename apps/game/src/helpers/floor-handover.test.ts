import { describe, expect, it } from 'vitest'

import { roundIdSchema } from '@melee/protocol/identifiers'

import { handsOverTheFloor } from './floor-handover'

const round = { id: roundIdSchema.parse('round-1') }
const next = { id: roundIdSchema.parse('round-2') }

describe('handsOverTheFloor', () => {
  it('[floor] plays a buzz taking the floor and a verdict handing it back', () => {
    expect(
      handsOverTheFloor({
        from: { phase: 'playing', round },
        to: { phase: 'buzzed', round }
      })
    ).toBe(true)
    expect(
      handsOverTheFloor({
        from: { phase: 'buzzed', round },
        to: { phase: 'playing', round }
      })
    ).toBe(true)
  })

  it('[floor] leaves a snapshot that keeps the phase alone', () => {
    expect(
      handsOverTheFloor({
        from: { phase: 'buzzed', round },
        to: { phase: 'buzzed', round }
      })
    ).toBe(false)
  })

  it('[floor] leaves a round opening and a reveal to their own motions', () => {
    expect(
      handsOverTheFloor({
        from: { phase: 'countdown', round },
        to: { phase: 'playing', round }
      })
    ).toBe(false)
    expect(
      handsOverTheFloor({
        from: { phase: 'buzzed', round },
        to: { phase: 'revealed', round }
      })
    ).toBe(false)
    expect(
      handsOverTheFloor({
        from: { phase: 'buzzed', round },
        to: { phase: 'playing', round: next }
      })
    ).toBe(false)
  })

  it('[floor] has nothing to hand over before the first view', () => {
    expect(
      handsOverTheFloor({ from: null, to: { phase: 'buzzed', round } })
    ).toBe(false)
  })
})
