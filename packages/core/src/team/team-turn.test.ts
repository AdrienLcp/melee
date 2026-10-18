import { describe, expect, it } from 'vitest'

import type { Team } from '@melee/protocol/team'

import {
  canPlayByTeam,
  hasTurnsAfter,
  playsThisTurn,
  wallAnswersRound
} from './team-turn'

const team = (id: string, seatIds: string[]): Team => ({
  board: null,
  colour: 1,
  id,
  name: null,
  score: 0,
  seatIds
})

const TEAMS = [team('team-1', ['anna']), team('team-2', ['ben'])]

describe('team turn', () => {
  it('[team-turn] plays a quiz by team where there are two teams', () => {
    expect(canPlayByTeam({ game: 'quiz', mode: 'choice', teamCount: 2 })).toBe(
      true
    )
  })

  it('[team-turn] never plays a race by team', () => {
    expect(canPlayByTeam({ game: 'quiz', mode: 'buzzer', teamCount: 3 })).toBe(
      false
    )
    expect(
      canPlayByTeam({ game: 'reflex', mode: 'buzzer', teamCount: 3 })
    ).toBe(false)
  })

  it('[team-turn] needs two teams for a set', () => {
    expect(canPlayByTeam({ game: 'quiz', mode: 'typed', teamCount: 1 })).toBe(
      false
    )
  })

  it('[team-turn] owes the next team its round until the last turn', () => {
    expect(hasTurnsAfter({ index: 0, of: 2, teamId: 'team-1' })).toBe(true)
    expect(hasTurnsAfter({ index: 1, of: 2, teamId: 'team-2' })).toBe(false)
    expect(hasTurnsAfter(null)).toBe(false)
  })

  it('[team-turn] lets the wall answer a quiz turn and nothing else', () => {
    const turn = { index: 0, of: 2, teamId: 'team-1' }

    expect(wallAnswersRound({ answerMode: 'choice', game: 'quiz', turn })).toBe(
      true
    )
    expect(
      wallAnswersRound({ answerMode: 'choice', game: 'quiz', turn: null })
    ).toBe(false)
    expect(wallAnswersRound({ answerMode: 'typed', game: 'slate', turn })).toBe(
      false
    )
  })

  it('[team-turn] lets the team on turn play and the others watch', () => {
    const turn = { index: 0, of: 2, teamId: 'team-1' }

    expect(playsThisTurn({ seatId: 'anna', teams: TEAMS, turn })).toBe(true)
    expect(playsThisTurn({ seatId: 'ben', teams: TEAMS, turn })).toBe(false)
    expect(playsThisTurn({ seatId: 'ben', teams: TEAMS, turn: null })).toBe(
      true
    )
  })
})
