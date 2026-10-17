import { describe, expect, it } from 'vitest'

import { setOrder } from './set-order'

const TEAMS = ['team-1', 'team-2', 'team-3']

describe('set order', () => {
  it('[set-order] plays the first set in the room’s own order', () => {
    expect(setOrder({ setsPlayed: 0, teamIds: TEAMS })).toEqual(TEAMS)
  })

  it('[set-order] hands the first turn to the next team every set', () => {
    expect(setOrder({ setsPlayed: 1, teamIds: TEAMS })).toEqual([
      'team-2',
      'team-3',
      'team-1'
    ])
    expect(setOrder({ setsPlayed: 2, teamIds: TEAMS })[0]).toBe('team-3')
  })

  it('[set-order] comes back round to the first team', () => {
    expect(setOrder({ setsPlayed: 3, teamIds: TEAMS })).toEqual(TEAMS)
  })

  it('[set-order] orders no teams as no turns', () => {
    expect(setOrder({ setsPlayed: 4, teamIds: [] })).toEqual([])
  })
})
