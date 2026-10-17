import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import { teamRoundResult } from './team-score'

describe('team score', () => {
  it('[team-score] pays the mean over the seats the round opened on', () => {
    expect(
      teamRoundResult({
        awards: [
          { playerId: 'anna', points: 3 * POINT },
          { playerId: 'ben', points: POINT }
        ],
        openedWithPlayerIds: new Set(['anna', 'ben', 'carl']),
        seatIds: ['anna', 'ben', 'carl', 'latecomer']
      })
    ).toBe(Math.round((4 * POINT) / 3))
  })

  it('[team-score] counts every seat before the round is stamped', () => {
    expect(
      teamRoundResult({
        awards: [{ playerId: 'anna', points: 2 * POINT }],
        openedWithPlayerIds: null,
        seatIds: ['anna', 'ben']
      })
    ).toBe(POINT)
  })

  it('[team-score] ignores what the round paid another team', () => {
    expect(
      teamRoundResult({
        awards: [{ playerId: 'rival', points: 3 * POINT }],
        openedWithPlayerIds: null,
        seatIds: ['anna', 'ben']
      })
    ).toBe(0)
  })

  it('[team-score] pays nothing to a team the round did not open on', () => {
    expect(
      teamRoundResult({
        awards: [],
        openedWithPlayerIds: new Set(['rival']),
        seatIds: ['anna']
      })
    ).toBe(0)
  })
})
