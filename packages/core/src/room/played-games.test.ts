import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BLINDTEST_SETTINGS,
  DEFAULT_GAME_SETTINGS
} from '@melee/protocol/game'

import { playedGamesOf, roundTotalsOf } from './played-games'

const { blindtest, quiz } = DEFAULT_GAME_SETTINGS

describe('playedGamesOf', () => {
  it('[played-games] gathers the rounds of one entry and adds up what each seat earned', () => {
    const games = playedGamesOf({
      lineUp: [quiz, blindtest],
      opened: [quiz, blindtest, quiz],
      paid: [
        [{ playerId: 'ada', points: 50_000 }],
        [{ playerId: 'bo', points: 70_000 }],
        [
          { playerId: 'ada', points: 30_000 },
          { playerId: 'bo', points: 20_000 }
        ]
      ]
    })

    expect(games).toEqual([
      {
        kind: 'quiz',
        lineUpAt: 0,
        roundCount: 2,
        totals: [
          { playerId: 'ada', points: 80_000 },
          { playerId: 'bo', points: 20_000 }
        ]
      },
      {
        kind: 'blindtest',
        lineUpAt: 1,
        roundCount: 1,
        totals: [{ playerId: 'bo', points: 70_000 }]
      }
    ])
  })

  it('[played-games] counts a round that paid nobody, and one not yet left behind', () => {
    const [game] = playedGamesOf({
      lineUp: [quiz],
      opened: [quiz, quiz],
      paid: [[]]
    })

    expect(game?.roundCount).toBe(2)
    expect(game?.totals).toEqual([])
  })

  it('[played-games] tells an entry the line-up no longer holds by `null`', () => {
    const edited = { ...DEFAULT_BLINDTEST_SETTINGS, roundDurationMs: 30_000 }
    const [game] = playedGamesOf({
      lineUp: [quiz],
      opened: [edited],
      paid: [[{ playerId: 'ada', points: 10_000 }]]
    })

    expect(game?.lineUpAt).toBeNull()
  })
})

describe('roundTotalsOf', () => {
  it('[played-games] sums a seat paid twice in a round and leaves out a nought', () => {
    expect(
      roundTotalsOf([
        { playerId: 'ada', points: 10_000 },
        { playerId: 'bo', points: 0 },
        { playerId: 'ada', points: 5_000 }
      ])
    ).toEqual([{ playerId: 'ada', points: 15_000 }])
  })
})
