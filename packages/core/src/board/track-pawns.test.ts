import { describe, expect, it } from 'vitest'

import type { PublicPlayer } from '@melee/protocol/room'
import type { Team } from '@melee/protocol/team'

import { rankTrackPawns, scoreTargetOf, trackPawnsOf } from './track-pawns'

const seat = (id: string, at: number | null): PublicPlayer => ({
  board: at === null ? null : { case: at, move: 0 },
  id,
  isConnected: true,
  isReady: false,
  nickname: id,
  score: 0
})

const team = (id: string, at: number | null): Team => ({
  board: at === null ? null : { case: at, move: 0 },
  colour: 1,
  id,
  name: null,
  score: 0,
  seatIds: []
})

describe('trackPawnsOf', () => {
  it('[board] walks a pawn per seat in a room with no team, each at its roster place', () => {
    const pawns = trackPawnsOf({
      players: [seat('ada', 0), seat('bob', 3)],
      teams: []
    })

    expect(
      pawns.map((pawn) => [
        pawn.id,
        pawn.kind,
        pawn.kind === 'seat' ? pawn.seat : null
      ])
    ).toEqual([
      ['ada', 'seat', 0],
      ['bob', 'seat', 1]
    ])
  })

  it('[board] walks the teams’ pawns, not their seats’, in a room in teams', () => {
    const pawns = trackPawnsOf({
      players: [seat('ada', null)],
      teams: [team('red', 2)]
    })

    expect(pawns.map((pawn) => [pawn.id, pawn.kind])).toEqual([['red', 'team']])
  })

  it('[board] has no pawn on a board that is off', () => {
    expect(
      trackPawnsOf({ players: [seat('ada', null)], teams: [team('red', null)] })
    ).toEqual([])
  })
})

describe('rankTrackPawns', () => {
  it('[board] puts the leader first and keeps a tie in roster order', () => {
    const ranked = rankTrackPawns(
      trackPawnsOf({
        players: [seat('ada', 2), seat('bob', 5), seat('cy', 2)],
        teams: []
      })
    )

    expect(ranked.map((pawn) => pawn.id)).toEqual(['bob', 'ada', 'cy'])
  })
})

describe('scoreTargetOf', () => {
  it('[board] moves a seat’s pawn through the seat and a team’s through the team', () => {
    const [seatPawn, teamPawn] = [
      ...trackPawnsOf({ players: [seat('ada', 0)], teams: [] }),
      ...trackPawnsOf({ players: [], teams: [team('red', 0)] })
    ]

    expect(seatPawn && scoreTargetOf(seatPawn)).toEqual({
      kind: 'seat',
      playerId: 'ada'
    })
    expect(teamPawn && scoreTargetOf(teamPawn)).toEqual({
      kind: 'team',
      teamId: 'red'
    })
  })
})
