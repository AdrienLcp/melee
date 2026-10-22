import { describe, expect, it } from 'vitest'

import type { RoundDuel } from '@melee/protocol/room'

import { canPlayDuel, playsThisRound } from './duel'

const DUEL: RoundDuel = {
  seatIds: ['alex', 'ben'],
  teamIds: ['team-1', 'team-2']
}

describe('duel', () => {
  it('[duel] plays a quiz as a duel where there are two teams', () => {
    expect(canPlayDuel({ game: 'quiz', mode: 'choice', teamCount: 2 })).toBe(
      true
    )
  })

  it('[duel] never plays a race as a duel', () => {
    expect(canPlayDuel({ game: 'quiz', mode: 'buzzer', teamCount: 3 })).toBe(
      false
    )
    expect(canPlayDuel({ game: 'reflex', mode: 'buzzer', teamCount: 3 })).toBe(
      false
    )
  })

  it('[duel] needs two teams', () => {
    expect(canPlayDuel({ game: 'quiz', mode: 'typed', teamCount: 1 })).toBe(
      false
    )
  })

  it('[duel] lets the two seats drawn play and everyone else watch', () => {
    expect(playsThisRound({ duel: DUEL, seatId: 'ben' })).toBe(true)
    expect(playsThisRound({ duel: DUEL, seatId: 'anna' })).toBe(false)
    expect(playsThisRound({ duel: DUEL, seatId: null })).toBe(false)
    expect(playsThisRound({ duel: null, seatId: 'anna' })).toBe(true)
  })
})
