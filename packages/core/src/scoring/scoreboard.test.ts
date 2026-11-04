import { describe, expect, it } from 'vitest'

import type { PublicPlayer } from '@melee/protocol/room'

import {
  buildRoster,
  buildScoreboard,
  hasAnybodyScored,
  roundPlacingOf,
  standingOf,
  winnersOf
} from './scoreboard'

const playerOn = (nickname: string, score: number): PublicPlayer => ({
  board: null,
  colour: 1,
  head: 'round',
  id: nickname.toLowerCase(),
  isConnected: true,
  isReady: false,
  nickname,
  score
})

const pawnOn = ({
  at,
  nickname,
  score
}: {
  at: number
  nickname: string
  score: number
}): PublicPlayer => ({
  ...playerOn(nickname, score),
  board: { case: at, move: 0 }
})

describe('buildScoreboard', () => {
  it('[scoring] orders by score, highest first', () => {
    const board = buildScoreboard([playerOn('Alice', 1), playerOn('Bob', 5)])

    expect(board.map((entry) => entry.player.nickname)).toEqual([
      'Bob',
      'Alice'
    ])
  })

  it('[scoring] gives tied players the same rank and skips the next one', () => {
    const board = buildScoreboard([
      playerOn('Alice', 5),
      playerOn('Bob', 5),
      playerOn('Chloe', 1)
    ])

    expect(board.map((entry) => entry.rank)).toEqual([1, 1, 3])
  })

  // The board is on a wall for the whole game. Any ordering that depends on
  // arrival order or object identity would visibly reshuffle tied players
  // between two renders of the same scores.
  it('[scoring] breaks ties deterministically, whatever the input order', () => {
    const nicknames = (players: PublicPlayer[]) =>
      buildScoreboard(players).map((entry) => entry.player.nickname)

    const oneWay = [playerOn('Bob', 5), playerOn('Alice', 5)]

    expect(nicknames(oneWay)).toEqual(['Alice', 'Bob'])
    expect(nicknames(oneWay.toReversed())).toEqual(['Alice', 'Bob'])
  })

  it('[scoring] puts the pawn furthest along first on a track, the score breaking a tie', () => {
    const board = buildScoreboard([
      pawnOn({ at: 3, nickname: 'Alice', score: 9 }),
      pawnOn({ at: 5, nickname: 'Bob', score: 2 }),
      pawnOn({ at: 3, nickname: 'Chloe', score: 4 })
    ])

    expect(board.map((entry) => entry.player.nickname)).toEqual([
      'Bob',
      'Alice',
      'Chloe'
    ])
    expect(board.map((entry) => entry.rank)).toEqual([1, 2, 3])
  })

  it('[scoring] handles an empty room', () => {
    expect(buildScoreboard([])).toEqual([])
  })
})

describe('buildRoster', () => {
  it('[scoring] lists a scored table by name, everyone sharing first', () => {
    const roster = buildRoster([
      pawnOn({ at: 3, nickname: 'Chloe', score: 9 }),
      pawnOn({ at: 5, nickname: 'Bob', score: 2 }),
      pawnOn({ at: 0, nickname: 'Alice', score: 0 })
    ])

    expect(roster.map((entry) => entry.player.nickname)).toEqual([
      'Alice',
      'Bob',
      'Chloe'
    ])
    expect(roster.map((entry) => entry.rank)).toEqual([1, 1, 1])
  })

  it('[scoring] stands a table nobody has scored on where its scoreboard stands it', () => {
    const table = [
      playerOn('Zoé', 0),
      playerOn('Alice', 0),
      playerOn('Marc', 0)
    ]

    expect(buildRoster(table)).toEqual(buildScoreboard(table))
  })
})

describe('hasAnybodyScored', () => {
  it('[scoring] is false while the whole room is on zero', () => {
    expect(hasAnybodyScored([playerOn('Alice', 0), playerOn('Bob', 0)])).toBe(
      false
    )
  })

  it('[scoring] is true as soon as one player is on the board', () => {
    expect(hasAnybodyScored([playerOn('Alice', 0), playerOn('Bob', 1)])).toBe(
      true
    )
  })

  it('[scoring] is false for an empty room', () => {
    expect(hasAnybodyScored([])).toBe(false)
  })
})

describe('winnersOf', () => {
  it('[scoring] names the one player on top', () => {
    const winners = winnersOf([playerOn('Alice', 1), playerOn('Bob', 5)])

    expect(winners.map((player) => player.nickname)).toEqual(['Bob'])
  })

  it('[scoring] names every player sharing first place', () => {
    const winners = winnersOf([
      playerOn('Chloe', 5),
      playerOn('Alice', 5),
      playerOn('Bob', 2)
    ])

    expect(winners.map((player) => player.nickname)).toEqual(['Alice', 'Chloe'])
  })

  it('[scoring] names nobody while the whole room is on zero', () => {
    expect(winnersOf([playerOn('Alice', 0), playerOn('Bob', 0)])).toEqual([])
  })
})

describe('standingOf', () => {
  const room = [
    playerOn('Alice', 7),
    playerOn('Bob', 4),
    playerOn('Chloe', 4),
    playerOn('Dan', 1)
  ]

  it('[scoring] answers a place and the size of the room', () => {
    expect(standingOf({ players: room, youId: 'dan' })).toEqual({
      rank: 4,
      roomSize: 4
    })
  })

  // Level with Chloe, and the board ranks a tie as one place rather than two.
  it('[scoring] gives a tie the place it shares', () => {
    expect(standingOf({ players: room, youId: 'bob' })).toEqual({
      rank: 2,
      roomSize: 4
    })
  })

  it('[scoring] says nothing while the whole room is on zero', () => {
    expect(
      standingOf({ players: [playerOn('Alice', 0)], youId: 'alice' })
    ).toBeNull()
  })

  it('[scoring] says nothing to a screen holding no seat', () => {
    expect(standingOf({ players: room, youId: null })).toBeNull()
  })
})

describe('roundPlacingOf', () => {
  const awards = [
    { playerId: 'bob', points: 1500 },
    { playerId: 'alice', points: 1900 },
    { playerId: 'chloe', points: 1500 },
    { playerId: 'dan', points: 0 }
  ]

  it('[scoring] places the seat the round paid the most first', () => {
    expect(roundPlacingOf({ awards, playerId: 'alice' })).toBe(1)
  })

  it('[scoring] gives a tie the place it shares', () => {
    expect(roundPlacingOf({ awards, playerId: 'chloe' })).toBe(2)
    expect(roundPlacingOf({ awards, playerId: 'bob' })).toBe(2)
  })

  it('[scoring] places nowhere a seat the round paid nothing', () => {
    expect(roundPlacingOf({ awards, playerId: 'dan' })).toBeNull()
    expect(roundPlacingOf({ awards, playerId: 'erin' })).toBeNull()
    expect(roundPlacingOf({ awards, playerId: null })).toBeNull()
  })
})
