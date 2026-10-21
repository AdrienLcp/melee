import { describe, expect, it } from 'vitest'

import type { RoundTurn } from '@melee/protocol/room'
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

const TEAMS = [team('team-1', ['anna', 'alex']), team('team-2', ['ben'])]

const turnOf = (turn: Partial<RoundTurn> = {}): RoundTurn => ({
  index: 0,
  of: 2,
  seatIds: null,
  style: 'byTeam',
  teamIds: ['team-1'],
  ...turn
})

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
    expect(hasTurnsAfter(turnOf())).toBe(true)
    expect(hasTurnsAfter(turnOf({ index: 1, teamIds: ['team-2'] }))).toBe(false)
    expect(hasTurnsAfter(null)).toBe(false)
  })

  it('[team-turn] lets the wall answer a quiz turn and nothing else', () => {
    const turn = turnOf()

    expect(wallAnswersRound({ answerMode: 'choice', game: 'quiz', turn })).toBe(
      true
    )
    expect(
      wallAnswersRound({ answerMode: 'choice', game: 'quiz', turn: null })
    ).toBe(false)
    expect(wallAnswersRound({ answerMode: 'typed', game: 'slate', turn })).toBe(
      false
    )
    expect(
      wallAnswersRound({
        answerMode: 'choice',
        game: 'quiz',
        turn: turnOf({ seatIds: ['anna'], style: 'solo' })
      })
    ).toBe(false)
  })

  it('[team-turn] lets the team on turn play and the others watch', () => {
    const turn = turnOf()

    expect(playsThisTurn({ seatId: 'anna', teams: TEAMS, turn })).toBe(true)
    expect(playsThisTurn({ seatId: 'ben', teams: TEAMS, turn })).toBe(false)
    expect(playsThisTurn({ seatId: 'ben', teams: TEAMS, turn: null })).toBe(
      true
    )
  })
  it('[team-turn] lets the seats a turn chose play and their teammates watch', () => {
    const solo = turnOf({ seatIds: ['anna'], style: 'solo' })
    const duel = turnOf({
      of: 1,
      seatIds: ['alex', 'ben'],
      style: 'duel',
      teamIds: ['team-1', 'team-2']
    })

    expect(playsThisTurn({ seatId: 'anna', teams: TEAMS, turn: solo })).toBe(
      true
    )
    expect(playsThisTurn({ seatId: 'alex', teams: TEAMS, turn: solo })).toBe(
      false
    )
    expect(playsThisTurn({ seatId: 'anna', teams: TEAMS, turn: duel })).toBe(
      false
    )
    expect(playsThisTurn({ seatId: 'ben', teams: TEAMS, turn: duel })).toBe(
      true
    )
    expect(playsThisTurn({ seatId: null, teams: TEAMS, turn: duel })).toBe(
      false
    )
  })
})
