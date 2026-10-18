import { describe, expect, it } from 'vitest'

import type { Team } from '@melee/protocol/team'

import { buildTeamBoard, teamOfSeat, teamWinnersOf } from './team-board'

const team = (colour: number, score: number, seatIds: string[] = []): Team => ({
  board: null,
  colour,
  id: `team-${colour}`,
  name: null,
  score,
  seatIds
})

describe('team board', () => {
  it('[team-board] ranks by score and shares a rank on a tie', () => {
    const board = buildTeamBoard([team(1, 2), team(2, 5), team(3, 5)])

    expect(board.map((entry) => [entry.team.id, entry.rank])).toEqual([
      ['team-2', 1],
      ['team-3', 1],
      ['team-1', 3]
    ])
  })

  it('[team-board] names no winner while no team has scored', () => {
    expect(teamWinnersOf([team(1, 0), team(2, 0)])).toEqual([])
  })

  it('[team-board] names every team sharing the top score', () => {
    expect(
      teamWinnersOf([team(1, 4), team(2, 4), team(3, 1)]).map(({ id }) => id)
    ).toEqual(['team-1', 'team-2'])
  })

  it('[team-board] finds the team a seat sits in, and none for a seat without one', () => {
    const teams = [team(1, 0, ['anna']), team(2, 0, ['ben'])]

    expect(teamOfSeat({ playerId: 'ben', teams })?.id).toBe('team-2')
    expect(teamOfSeat({ playerId: 'carl', teams })).toBeNull()
  })
})
