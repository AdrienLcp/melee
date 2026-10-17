import { describe, expect, it } from 'vitest'

import { dealTeams, isFairDeal } from './team-draw'

const TWELVE = Array.from({ length: 12 }, (_, index) => `seat-${index + 1}`)

describe('team draw', () => {
  it('[team-draw] deals twelve seats into three teams of four, every seat once', () => {
    const teams = dealTeams({ count: 3, seatIds: TWELVE })

    expect(teams.map((team) => team.length)).toEqual([4, 4, 4])
    expect(teams.flat().toSorted()).toEqual(TWELVE.toSorted())
  })

  it('[team-draw] deals eleven seats within one seat of each other', () => {
    const teams = dealTeams({ count: 3, seatIds: TWELVE.slice(0, 11) })

    expect(teams.map((team) => team.length)).toEqual([4, 4, 3])
  })

  it('[team-draw] accepts what the console deals', () => {
    expect(
      isFairDeal({
        assignment: dealTeams({ count: 4, seatIds: TWELVE }),
        seatIds: TWELVE
      })
    ).toBe(true)
  })

  it('[team-draw] refuses a deal two seats apart', () => {
    expect(
      isFairDeal({
        assignment: [TWELVE.slice(0, 5), TWELVE.slice(5, 8), TWELVE.slice(8)],
        seatIds: TWELVE
      })
    ).toBe(false)
  })

  it('[team-draw] refuses a deal that leaves a seat out', () => {
    expect(
      isFairDeal({
        assignment: [TWELVE.slice(0, 6), TWELVE.slice(6, 11)],
        seatIds: TWELVE
      })
    ).toBe(false)
  })

  it('[team-draw] refuses a seat dealt twice in place of another', () => {
    expect(
      isFairDeal({
        assignment: [TWELVE.slice(0, 6), [...TWELVE.slice(6, 11), 'seat-1']],
        seatIds: TWELVE
      })
    ).toBe(false)
  })

  it('[team-draw] refuses a seat that is not in the room', () => {
    expect(
      isFairDeal({
        assignment: [TWELVE.slice(0, 6), [...TWELVE.slice(6, 11), 'stranger']],
        seatIds: TWELVE
      })
    ).toBe(false)
  })

  it('[team-draw] refuses an empty team', () => {
    expect(
      isFairDeal({ assignment: [['seat-1'], []], seatIds: ['seat-1'] })
    ).toBe(false)
  })
})
