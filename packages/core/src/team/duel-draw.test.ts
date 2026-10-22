import { describe, expect, it } from 'vitest'

import type { PlayerId } from '@melee/protocol/identifiers'

import { drawDuel, type TeamSeats } from './duel-draw'

const TEAMS: TeamSeats[] = [
  { id: 'team-1', seatIds: ['anna', 'ben'] },
  { id: 'team-2', seatIds: ['carl'] },
  { id: 'team-3', seatIds: ['dora', 'emil'] }
]

const playDuels = (count: number): PlayerId[][] => {
  const duelsBySeat = new Map<PlayerId, number>()

  return Array.from({ length: count }, () => {
    const duel = drawDuel({ duelsBySeat, teams: TEAMS })

    for (const seatId of duel?.seatIds ?? []) {
      duelsBySeat.set(seatId, (duelsBySeat.get(seatId) ?? 0) + 1)
    }

    return duel?.seatIds ?? []
  })
}

describe('duel draw', () => {
  it('[duel-draw] sets two teams against each other in a duel', () => {
    expect(drawDuel({ duelsBySeat: new Map(), teams: TEAMS })).toEqual({
      seatIds: ['anna', 'carl'],
      teamIds: ['team-1', 'team-2']
    })
  })

  it('[duel-draw] lets every seat duel before anyone duels twice', () => {
    const firstThree = playDuels(3).flat()

    expect(firstThree.slice(0, 4).toSorted()).toEqual(
      ['anna', 'ben', 'carl', 'dora'].toSorted()
    )
    expect(firstThree).toContain('emil')
  })

  it('[duel-draw] draws no duel without two teams holding a seat', () => {
    expect(
      drawDuel({
        duelsBySeat: new Map(),
        teams: [
          { id: 'team-1', seatIds: ['anna', 'ben'] },
          { id: 'team-2', seatIds: [] }
        ]
      })
    ).toBeNull()
  })
})
