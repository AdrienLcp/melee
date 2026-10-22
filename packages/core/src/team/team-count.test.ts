import { describe, expect, it } from 'vitest'

import { suggestedTeamCount } from './team-count'

describe('suggested team count', () => {
  it('[team-count] splits a table of up to seven in two', () => {
    expect([0, 4, 7].map(suggestedTeamCount)).toEqual([2, 2, 2])
  })

  it('[team-count] splits eight to eleven in three, and twelve and more in four', () => {
    expect([8, 11, 12, 20].map(suggestedTeamCount)).toEqual([3, 3, 4, 4])
  })
})
