import { describe, expect, it } from 'vitest'

import { teamForLateSeat } from './late-seat'

describe('late seat', () => {
  it('[late-seat] joins the team with the fewest connected seats', () => {
    expect(
      teamForLateSeat([
        { connectedSeatCount: 4, id: 'team-1' },
        { connectedSeatCount: 3, id: 'team-2' },
        { connectedSeatCount: 4, id: 'team-3' }
      ])
    ).toBe('team-2')
  })

  it('[late-seat] settles a tie on the first team', () => {
    expect(
      teamForLateSeat([
        { connectedSeatCount: 4, id: 'team-1' },
        { connectedSeatCount: 3, id: 'team-2' },
        { connectedSeatCount: 3, id: 'team-3' }
      ])
    ).toBe('team-2')
  })

  it('[late-seat] has nowhere to go in a room without teams', () => {
    expect(teamForLateSeat([])).toBeNull()
  })
})
