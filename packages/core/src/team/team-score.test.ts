import { describe, expect, it } from 'vitest'

import { POINT } from '@melee/protocol/scoring'

import { teamRoundResult } from './team-score'

describe('team score', () => {
  it('[team-score] pays the sum over the seats the round opened on', () => {
    expect(
      teamRoundResult({
        answersAsOne: false,
        awards: [
          { playerId: 'anna', points: 3 * POINT },
          { playerId: 'ben', points: POINT },
          { playerId: 'latecomer', points: 2 * POINT }
        ],
        openedWithPlayerIds: new Set(['anna', 'ben', 'carl']),
        seatIds: ['anna', 'ben', 'carl', 'latecomer']
      })
    ).toBe(4 * POINT)
  })

  it('[team-score] counts every seat before the round is stamped', () => {
    expect(
      teamRoundResult({
        answersAsOne: false,
        awards: [
          { playerId: 'anna', points: 2 * POINT },
          { playerId: 'ben', points: POINT }
        ],
        openedWithPlayerIds: null,
        seatIds: ['anna', 'ben']
      })
    ).toBe(3 * POINT)
  })

  it('[team-score] pays a team answering as one its attempt once', () => {
    expect(
      teamRoundResult({
        answersAsOne: true,
        awards: [
          { playerId: 'anna', points: 2 * POINT },
          { playerId: 'ben', points: 2 * POINT },
          { playerId: 'carl', points: 2 * POINT }
        ],
        openedWithPlayerIds: new Set(['anna', 'ben', 'carl']),
        seatIds: ['anna', 'ben', 'carl']
      })
    ).toBe(2 * POINT)
  })

  it('[team-score] ignores what the round paid another team', () => {
    expect(
      teamRoundResult({
        answersAsOne: false,
        awards: [{ playerId: 'rival', points: 3 * POINT }],
        openedWithPlayerIds: null,
        seatIds: ['anna', 'ben']
      })
    ).toBe(0)
  })

  it('[team-score] pays nothing to a team the round did not open on', () => {
    expect(
      teamRoundResult({
        answersAsOne: true,
        awards: [{ playerId: 'anna', points: POINT }],
        openedWithPlayerIds: new Set(['rival']),
        seatIds: ['anna']
      })
    ).toBe(0)
  })
})
