import { describe, expect, it } from 'vitest'

import { isTeamRoundPerfect } from './team-score'

const AWARDS = [
  { isPerfect: true, playerId: 'anna' },
  { isPerfect: false, playerId: 'ben' }
]

const perfectUnder = (
  scoring: 'balanced' | 'sum',
  answersAsOne = false
): boolean =>
  isTeamRoundPerfect({
    answersAsOne,
    awards: AWARDS,
    openedWithPlayerIds: new Set(['anna', 'ben']),
    scoring,
    seatIds: ['anna', 'ben', 'latecomer']
  })

describe('a team round holds a perfect answer', () => {
  it('[team-score] holds one under a sum when any seat gave it', () => {
    expect(perfectUnder('sum')).toBe(true)
  })

  it('[team-score] holds one under a mean only when every seat it opened on gave it', () => {
    expect(perfectUnder('balanced')).toBe(false)
    expect(
      isTeamRoundPerfect({
        answersAsOne: false,
        awards: [{ isPerfect: true, playerId: 'anna' }],
        openedWithPlayerIds: new Set(['anna']),
        scoring: 'balanced',
        seatIds: ['anna', 'latecomer']
      })
    ).toBe(true)
  })

  it('[team-score] holds one when the team answers as one and its attempt was', () => {
    expect(perfectUnder('balanced', true)).toBe(true)
  })
})
