import { describe, expect, it } from 'vitest'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { TeamId } from '@melee/protocol/team'

import { drawSpokenTurn, type SpokenTeam, type SpokenTurn } from './spoken-turn'

const TEAMS: SpokenTeam[] = [
  { id: 'team-1', seatIds: ['anna', 'ben'] },
  { id: 'team-2', seatIds: ['carl'] },
  { id: 'team-3', seatIds: ['dora', 'emil'] }
]

const playTurns = (
  count: number,
  teams: readonly SpokenTeam[] = TEAMS
): SpokenTurn[] => {
  const guessesByTeam = new Map<TeamId, number>()
  const keepsBySeat = new Map<PlayerId, number>()

  return Array.from({ length: count }, () => {
    const turn = drawSpokenTurn({ guessesByTeam, keepsBySeat, teams })

    if (turn === null) {
      throw new Error('no turn drawn')
    }

    guessesByTeam.set(
      turn.guessingTeamId,
      (guessesByTeam.get(turn.guessingTeamId) ?? 0) + 1
    )
    keepsBySeat.set(turn.keeperId, (keepsBySeat.get(turn.keeperId) ?? 0) + 1)

    return turn
  })
}

describe('spoken turn', () => {
  it('[spoken-turn] gives the list to a seat of another team', () => {
    for (const turn of playTurns(12)) {
      const guessing = TEAMS.find((team) => team.id === turn.guessingTeamId)

      expect(guessing?.seatIds).not.toContain(turn.keeperId)
    }
  })

  it('[spoken-turn] lets every team guess as often as every other', () => {
    const guessing = playTurns(6).map((turn) => turn.guessingTeamId)

    expect(guessing).toEqual([
      'team-1',
      'team-2',
      'team-3',
      'team-1',
      'team-2',
      'team-3'
    ])
  })

  it('[spoken-turn] lets every seat keep before any keeps twice', () => {
    const keepers = playTurns(5).map((turn) => turn.keeperId)

    expect(new Set(keepers).size).toBe(5)
  })

  it('[spoken-turn] passes over a team with no seat', () => {
    const turns = playTurns(2, [
      { id: 'team-1', seatIds: [] },
      { id: 'team-2', seatIds: ['carl'] },
      { id: 'team-3', seatIds: ['dora'] }
    ])

    expect(turns).toEqual([
      { guessingTeamId: 'team-2', keeperId: 'dora' },
      { guessingTeamId: 'team-3', keeperId: 'carl' }
    ])
  })

  it('[spoken-turn] draws nothing while a single team holds every seat', () => {
    expect(
      drawSpokenTurn({
        guessesByTeam: new Map(),
        keepsBySeat: new Map(),
        teams: [
          { id: 'team-1', seatIds: ['anna', 'ben'] },
          { id: 'team-2', seatIds: [] }
        ]
      })
    ).toBeNull()
  })
})
