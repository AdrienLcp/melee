import { describe, expect, it } from 'vitest'

import type { Team } from '@melee/protocol/team'

import {
  buildTeamBoard,
  isEveryTeamItsOwnSeat,
  teamOfSeat,
  teamStandingOf,
  teamWinnersOf
} from './team-board'

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

  it('[team-board] ranks a track by case, the score breaking a tie on one case', () => {
    const onCase = (colour: number, score: number, at: number): Team => ({
      ...team(colour, score),
      board: { case: at, move: 0 }
    })
    const board = buildTeamBoard([
      onCase(1, 9_000, 8),
      onCase(2, 7_500, 9),
      onCase(3, 8_200, 8)
    ])

    expect(board.map((entry) => [entry.team.id, entry.rank])).toEqual([
      ['team-2', 1],
      ['team-1', 2],
      ['team-3', 3]
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

  it('[team-board] reads a team named after its only seat as that seat', () => {
    const seat = (id: string, nickname: string) => ({ id, nickname })
    const named = (colour: number, name: string, seatIds: string[]): Team => ({
      ...team(colour, 0, seatIds),
      name
    })
    const players = [
      seat('a', 'The Blues'),
      seat('b', 'Mamie'),
      seat('c', 'Léo')
    ]

    expect(
      isEveryTeamItsOwnSeat({
        players,
        teams: [named(1, 'The Blues', ['a']), named(2, 'Mamie', ['b'])]
      })
    ).toBe(true)
    expect(
      isEveryTeamItsOwnSeat({
        players,
        teams: [named(1, 'The Blues', ['a']), named(2, 'Mamie', ['b', 'c'])]
      })
    ).toBe(false)
    expect(isEveryTeamItsOwnSeat({ players, teams: [team(1, 0, ['a'])] })).toBe(
      false
    )
    expect(isEveryTeamItsOwnSeat({ players, teams: [] })).toBe(false)
  })
})

describe('teamStandingOf', () => {
  it('[team-board] places a seat where its team stands, among the teams', () => {
    const teams = [team(1, 2, ['ann']), team(2, 5, ['bob']), team(3, 3, ['cy'])]

    expect(teamStandingOf({ playerId: 'cy', teams })).toEqual({
      rank: 2,
      roomSize: 3
    })
  })

  it('[team-board] places nobody before a team has scored', () => {
    expect(
      teamStandingOf({
        playerId: 'ann',
        teams: [team(1, 0, ['ann']), team(2, 0)]
      })
    ).toBeNull()
  })

  it('[team-board] places no seat a team does not hold', () => {
    expect(
      teamStandingOf({ playerId: 'dan', teams: [team(1, 4, ['ann'])] })
    ).toBeNull()
  })
})
