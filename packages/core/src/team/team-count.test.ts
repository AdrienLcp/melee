import { describe, expect, it } from 'vitest'

import {
  fieldsTeams,
  MIN_SEATS_FOR_TEAMS,
  suggestedTeamCount,
  teamCountsFor
} from './team-count'

describe('suggested team count', () => {
  it('[team-count] splits a table of up to seven in two', () => {
    expect([0, 4, 7].map(suggestedTeamCount)).toEqual([2, 2, 2])
  })

  it('[team-count] splits eight to eleven in three, and twelve and more in four', () => {
    expect([8, 11, 12, 20].map(suggestedTeamCount)).toEqual([3, 3, 4, 4])
  })
})

describe('the counts a table may be dealt into', () => {
  it('[team-count] offers no count under the smallest table for teams', () => {
    expect([0, 1, MIN_SEATS_FOR_TEAMS - 1].map(teamCountsFor)).toEqual([
      [],
      [],
      []
    ])
  })

  it('[team-count] adds a team for every two seats, so at most one plays alone', () => {
    expect([3, 4, 5, 7].map(teamCountsFor)).toEqual([
      [2],
      [2],
      [2, 3],
      [2, 3, 4]
    ])
  })

  it('[team-count] stops at the most teams a room holds', () => {
    expect(teamCountsFor(40)).toEqual([2, 3, 4, 5, 6])
  })
})

describe('a table fielding teams', () => {
  it('[team-count] plays a table of one or two as itself', () => {
    expect(
      [1, 2].map((seatCount) => fieldsTeams({ filledTeamCount: 2, seatCount }))
    ).toEqual([false, false])
  })

  it('[team-count] fields two against one, but not one team holding every seat', () => {
    expect(fieldsTeams({ filledTeamCount: 2, seatCount: 3 })).toBe(true)
    expect(fieldsTeams({ filledTeamCount: 1, seatCount: 5 })).toBe(false)
  })
})
