import { describe, expect, it } from 'vitest'

import { playerIdSchema } from '@melee/protocol/identifiers'

import { roomsChoice, tallyBallots } from './tally'

const [ana, ben, cleo, dan] = ['ana', 'ben', 'cleo', 'dan'].map((id) =>
  playerIdSchema.parse(id)
)

const ballotsFor = (...seats: string[]) =>
  seats.map((seat) => ({ seatId: playerIdSchema.parse(seat) }))

describe('the most-likely tally', () => {
  it('[mostlikely] counts each seat once, most first, and leaves out the seats nobody chose', () => {
    expect(
      tallyBallots(ballotsFor('ben', 'ana', 'ben', 'ben', 'cleo'))
    ).toEqual([
      { playerId: ben, votes: 3 },
      { playerId: ana, votes: 1 },
      { playerId: cleo, votes: 1 }
    ])
  })

  it('[mostlikely] chooses the seat with the most ballots', () => {
    expect(roomsChoice(tallyBallots(ballotsFor('ben', 'ana', 'ben')))).toEqual([
      ben
    ])
  })

  it('[mostlikely] chooses every seat tied on the most', () => {
    expect(
      roomsChoice(tallyBallots(ballotsFor('ben', 'dan', 'ben', 'dan', 'ana')))
    ).toEqual([ben, dan])
  })

  it('[mostlikely] chooses nobody when every ballot went somewhere different', () => {
    expect(roomsChoice(tallyBallots(ballotsFor('ana', 'ben', 'cleo')))).toEqual(
      []
    )
    expect(roomsChoice([])).toEqual([])
  })
})
